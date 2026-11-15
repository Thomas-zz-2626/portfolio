import { useState, useRef, useEffect, useCallback } from 'react'
import './Lightbox.css'
import { getSrcSet, getLqip, SIZES } from '../imageSrc'
import Narrative from './Narrative'
import Pest from './Pest'
import DemandReading from './DemandReading'
import CmfSteps from './CmfSteps'
import RelatedCarousel from './RelatedCarousel'
import FinalStack from './FinalStack'
import ScrollWordReveal from './ScrollWordReveal'
import { initReveal } from '../scrollReveal'
import BrightnessCharts from './BrightnessCharts'

// Split a sentence into segments, wrapping the highlighted words in a span
const highlightWords = (text, words) => {
  if (!words || words.length === 0) return text
  const pattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const parts = text.split(new RegExp(`(${pattern})`))
  return parts.map((part, i) =>
    words.includes(part) ? (
      <span key={i} className="lightbox__goal-accent">{part}</span>
    ) : (
      part
    )
  )
}

// 元信息四行(年份/周期/类型/参与)——叠图变体(空气炸锅 hero、擦窗机
// 首图)与独立板块共用;≤768px 由 CSS 切换为单行
const MetaRows = ({ project }) => (
  <div className="lightbox__meta-rows">
    <div className="lightbox__meta-row">
      <span className="lightbox__meta-label">年份</span>
      <span className="lightbox__meta-value">{project.year}</span>
    </div>
    <div className="lightbox__meta-row">
      <span className="lightbox__meta-label">周期</span>
      <span className="lightbox__meta-value">{project.duration}</span>
    </div>
    <div className="lightbox__meta-row">
      <span className="lightbox__meta-label">类型</span>
      <span className="lightbox__meta-value">{project.type}</span>
    </div>
    <div className="lightbox__meta-row">
      <span className="lightbox__meta-label">参与</span>
      <span className="lightbox__meta-value">{project.skills}</span>
    </div>
  </div>
)

// ── 底部溶解(hero 与首图共用,2026-11-07 首图复用):滚动离开时板块
//    底部开启虚化带,内容随滚动渐入下一板块底色——跟手效果,非入场
//    动效;reduced-motion 下调用方直接跳过(不挂监听)。返回清理函数。 ──
const startBottomDissolve = (scrollEl, sectionEl, maskEl, fadeVar) => {
  // 开带前必须先滚过这段距离(静止时零蒙版,主体完全清晰)
  const START_SHARE = 0.1
  // 虚化带从开带到最深所需的滚动量
  const RAMP_SHARE = 0.75
  // 带高下限 180px——保证淡出边缘柔和,不会出现刀切边
  const MIN_BAND = 180
  // 带高上限:视口高的一半
  const MAX_SHARE = 0.5

  let current = 0
  let target = 0
  let raf = null

  const measure = () => {
    const vh = window.innerHeight
    const start = vh * START_SHARE
    // At rest nothing is masked at all: the image has to read razor-sharp on
    // load, so the dissolve does not exist until the reader scrolls past it.
    if (scrollEl.scrollTop <= start) {
      target = 0
      return
    }
    const max = vh * MAX_SHARE
    const q = Math.min((scrollEl.scrollTop - start) / (vh * RAMP_SHARE), 1)
    // The band opens straight to its 180px floor — the damped follower eases
    // that step — then deepens with an ease-out. It is never narrower than
    // the floor, so the fade edge is never knife-cut.
    target = MIN_BAND + (max - MIN_BAND) * (1 - (1 - q) * (1 - q))
  }

  const paint = (h) => {
    sectionEl.style.setProperty(fadeVar, `${h.toFixed(1)}px`)
    sectionEl.classList.toggle('is-dissolving', h > 0.5)
  }

  const tick = () => {
    current += (target - current) * 0.12 // damped follow — the "缓动"
    if (Math.abs(target - current) < 0.3) {
      current = target
      paint(current)
      raf = null
      return
    }
    paint(current)
    raf = requestAnimationFrame(tick)
  }

  const handleScroll = () => {
    measure()
    if (raf === null) raf = requestAnimationFrame(tick)
  }

  measure()
  current = target
  paint(current)
  scrollEl.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)

  return () => {
    scrollEl.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleScroll)
    if (raf !== null) cancelAnimationFrame(raf)
    sectionEl.style.removeProperty(fadeVar)
    sectionEl.classList.remove('is-dissolving')
  }
}

// LQIP 占位:加载中显示低清模糊底图(lqip-img CSS),载入后淡入原图。
// 原图文件本身不变,最终视觉与之前完全一致。
const lqStyle = (src) => {
  const l = getLqip(src)
  return l ? { backgroundImage: `url("${l}")` } : undefined
}
const markLoaded = (e) => e.currentTarget.classList.add('is-loaded')
const loadedRef = (n) => { if (n && n.complete) n.classList.add('is-loaded') }

// 视频首帧落画:metadata 载入后 seek 到 0.001s,强制解码并绘制第一帧。
// 海报文件缺失/过期时视频也不会黑屏(即时首帧仍由 posterFor 的海报负责)。
const paintFirstFrame = (e) => {
  const v = e.currentTarget
  if (!v.paused) return
  try { v.currentTime = 0.001 } catch { /* noop */ }
}

// 视频海报:<同名>-poster.jpg(poster-extract 提取的首帧),避免整段 preload
const posterFor = (src) => (src ? src.replace(/\.(mp4|webm)$/i, '-poster.jpg') : undefined)

function Lightbox({ project, relatedProjects, relatedCenterIdx, onNavigate, onClose }) {
  const [videoEnded, setVideoEnded] = useState(false)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const contentRef = useRef(null)
  const scrollRef = useRef(null)
  const videoRef = useRef(null)
  // 氚管灯:文字一旦显示(播完/兜底/出错)就锁定,移动端点击播放不再把它藏回去
  const heroTextLocked = useRef(false)

  // ── Mobile (<640px): hero video falls back to poster + tap-to-play ──
  //    Tablet (640-1023) keeps the desktop muted autoplay untouched.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [mobileVideoPlaying, setMobileVideoPlaying] = useState(false)
  // 光视频板块:reduced-motion 时不自动循环播放(动效规范 v1:关闭无限循环)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  // 展开显示完整过程(2026-11-07 用户要求):背景.png 衔接处下方的居中箭头,
  // 点击一次性展开其后的两张图(占位待替换);现有内容不收起;
  // 切换卡片时重置收起态
  const [processExpanded, setProcessExpanded] = useState(false)
  useEffect(() => { setProcessExpanded(false) }, [project.id])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const rmq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      setIsMobile(mq.matches)
      setReducedMotion(rmq.matches)
    }
    onChange()
    mq.addEventListener('change', onChange)
    rmq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      rmq.removeEventListener('change', onChange)
    }
  }, [])

  const handleHeroVideoTap = () => {
    // Poster tap on mobile: start the muted clip. onPlay hides the overlay.
    const v = videoRef.current
    if (!v) return
    const p = v.play()
    if (p) p.catch(() => {})
  }

  // ── Related carousel ──
  const projects = relatedProjects || []
  const N = projects.length

  // Reset video state and scroll when project changes
  useEffect(() => {
    heroTextLocked.current = false
    setVideoEnded(false)
    setMobileVideoPlaying(false)
    // Scroll to top after React commits the new DOM
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0
      }
    })
  }, [project.id, projects])

  const handleNavigate = (item) => {
    // Reduced motion: swap the project directly, no opacity fade
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (contentRef.current) {
        contentRef.current.style.opacity = ''
        contentRef.current.style.transition = ''
        contentRef.current.style.backgroundColor = item.heroBg === 'light' ? '#f5f5f3' : '#000000'
      }
      onNavigate(item)
      return
    }

    // Instantly hide
    if (contentRef.current) {
      contentRef.current.style.opacity = '0'
      contentRef.current.style.transition = 'none'
    }

    // Swap project data
    onNavigate(item)

    // Update hero background color
    const newHeroBg = item.heroBg === 'light' ? '#f5f5f3' : '#000000'
    if (contentRef.current) {
      contentRef.current.style.backgroundColor = newHeroBg
    }

    // Force browser to paint the hidden state, then fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = 'opacity 0.4s ease'
          contentRef.current.style.opacity = '1'
          // Clean up inline styles after transition completes
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.style.opacity = ''
              contentRef.current.style.transition = ''
            }
          }, 420)
        }
      })
    })
  }

  const isLight = project.heroBg !== 'dark'
  const heroBg = project.heroBg && project.heroBg.startsWith('#')
    ? project.heroBg
    : isLight ? '#f5f5f3' : '#000000'
  const heroRef = useRef(null)
  const firstRef = useRef(null)
  const didFirstPlay = useRef(false)

  // ── IntersectionObserver: reset video when hero leaves viewport, replay when it returns ──
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || !project.heroVideo) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Hero came back into view — play from beginning
            if (didFirstPlay.current && videoRef.current) {
              heroTextLocked.current = false
              videoRef.current.currentTime = 0
              const p = videoRef.current.play()
              if (p) p.catch(() => {})
              setVideoEnded(false)
            }
            didFirstPlay.current = true
          } else {
            // Hero left viewport — silently reset to frame 1
            if (didFirstPlay.current && videoRef.current) {
              heroTextLocked.current = false
              videoRef.current.currentTime = 0
              videoRef.current.pause()
              setVideoEnded(false)
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [project.id, project.heroVideo])

  // ── 氚管灯:顶部文字只在视频完整播完后淡入(opacity 0→1,800ms,
  //    纯 CSS opacity,不触发重排)。容错:error 立即显示;连续 3s 无
  //    加载/播放进度(卡住、加载失败、等待点击等)自动兜底显示,
  //    文字永远不会卡在不可见。videoEnded 翻转时重跑:重播后重新武装。──
  useEffect(() => {
    if (!project.heroTextAfterVideo) return
    const v = videoRef.current
    if (!v || videoEnded) return

    const show = () => {
      heroTextLocked.current = true
      setVideoEnded(true)
    }
    let timer = null
    // 有进度 = 健康:计时器不断重置,正常播放的视频只走 ended 路径
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(show, 3000)
    }
    const onError = () => {
      clearTimeout(timer)
      show()
    }
    arm()
    v.addEventListener('timeupdate', arm)
    v.addEventListener('progress', arm)
    v.addEventListener('error', onError)
    return () => {
      clearTimeout(timer)
      v.removeEventListener('timeupdate', arm)
      v.removeEventListener('progress', arm)
      v.removeEventListener('error', onError)
    }
  }, [project.id, project.heroTextAfterVideo, videoEnded])

  // ── Showcase videos: preload="metadata" + 海报占位,文件本身直到接近
  //    视口才加载(data-src 懒加载),播放仍限定在视口中心带 —— 只有
  //    中心带内离屏幕中心最近的唯一一条在播,其余全部暂停。──
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const videos = [...scrollEl.querySelectorAll('.lightbox__showcase video')]
    if (videos.length === 0) return

    // Which videos currently overlap the center band of the viewport.
    const inBand = new Map(videos.map((v) => [v, false]))
    let currentBest = null

    // Let exactly one video run: the band member whose center sits closest
    // to the viewport center. Everyone else pauses. No-op unless the
    // winner changed since last call.
    const sync = () => {
      let best = null
      let bestD = Infinity
      for (const [v, on] of inBand) {
        if (!on) continue
        const r = v.getBoundingClientRect()
        const d = Math.abs(r.top + r.height / 2 - window.innerHeight / 2)
        if (d < bestD) { bestD = d; best = v }
      }
      if (best === currentBest) return
      currentBest = best
      videos.forEach((v) => {
        if (v === best) {
          const p = v.play()
          if (p) p.catch(() => {})
        } else {
          v.pause()
        }
      })
    }

    const bandObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => inBand.set(entry.target, entry.isIntersecting))
        sync()
      },
      // Shrink the viewport to the middle ~16% band: a video is "on stage"
      // only while its box overlaps that band, i.e. while the video sits at
      // the center of the screen.
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    )
    videos.forEach((v) => bandObserver.observe(v))

    // 懒加载:video 只有 data-src、没有 src,接近视口才把 src 挂上。
    // 桌面 150% 余量提前起载;手机只留 50%(移动数据省流,进视口才下载)。
    const lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const v = entry.target
          const src = v.getAttribute('data-src')
          if (src) {
            v.removeAttribute('data-src')
            v.src = src
            // 若此时已在中心带内,等可播后立刻补一次同步
            v.addEventListener('canplay', sync, { once: true })
            sync()
          }
          lazyObserver.unobserve(v)
        })
      },
      { rootMargin: isMobile ? '50% 0px 50% 0px' : '150% 0px 150% 0px', threshold: 0 }
    )
    videos.forEach((v) => { if (v.hasAttribute('data-src')) lazyObserver.observe(v) })

    return () => { bandObserver.disconnect(); lazyObserver.disconnect() }
  }, [project.id, isMobile])

  // ── 滚动触发动效(统一系统):灯箱滚动容器是 .lightbox__scroll ──
  // 项目切换会重挂部分区块,按 project.id 重新初始化;已入场内容保持可见。
  useEffect(() => {
    const el = scrollRef.current
    return el ? initReveal(el, { scroller: '.lightbox__scroll' }) : undefined
  }, [project.id])

  // ── Open: trigger CSS transition after mount ──
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setVisible(true)
      // Set content to fullscreen
      if (contentRef.current) {
        contentRef.current.style.left = '0'
        contentRef.current.style.top = '0'
        contentRef.current.style.width = `${window.innerWidth}px`
        contentRef.current.style.height = `${window.innerHeight}px`
        contentRef.current.style.borderRadius = '0'
        contentRef.current.style.backgroundColor = heroBg
      }
    })
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Browser / system back button support ──
  const closingRef = useRef(false)

  useEffect(() => {
    // Push a history entry so the back button can close the lightbox
    window.history.pushState({ lightbox: true }, '')

    const handlePopState = () => {
      if (closingRef.current) return
      closingRef.current = true
      setClosing(true)
      setTimeout(() => {
        onClose()
      }, 420)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Close: go back in history (triggers popstate → actually closes) ──
  const handleClose = useCallback(() => {
    if (closingRef.current) return
    window.history.back()
  }, [])

  // ── Escape key ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleClose])

  // ── Window resize ──
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current && !closing) {
        contentRef.current.style.width = `${window.innerWidth}px`
        contentRef.current.style.height = `${window.innerHeight}px`
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [closing])

  // ── Hero bottom dissolve — deepens as the hero scrolls away ──
  useEffect(() => {
    const scrollEl = scrollRef.current
    const hero = heroRef.current
    if (!scrollEl || !hero || !project.heroFade) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const maskEl = hero.querySelector('.lightbox__hero-img')
    if (!maskEl) return
    return startBottomDissolve(scrollEl, hero, maskEl, '--hero-fade-h')
  }, [project.id, project.heroFade])

  // ── 首图底部溶解(2026-11-07 用户要求,仿空气炸锅 heroFade):同上,
  //    作用于卡片首图——滚动离开时图底+四行字一起虚化渐入下方板块色 ──
  useEffect(() => {
    const scrollEl = scrollRef.current
    const first = firstRef.current
    if (!scrollEl || !first || !project.firstFade) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const maskEl = first.querySelector('.lightbox__first-media')
    if (!maskEl) return
    return startBottomDissolve(scrollEl, first, maskEl, '--first-fade-h')
  }, [project.id, project.firstFade])

  return (
    <div className={`lightbox${visible ? ' lightbox--visible' : ''}${closing ? ' lightbox--closing' : ''}`}>
      {/* Backdrop */}
      <div className="lightbox__backdrop" onClick={handleClose} />

      {/* Fixed close button — outside content to avoid overflow clipping */}
      <button
        type="button"
        className="lightbox__close"
        onClick={handleClose}
        aria-label="关闭"
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="7" y1="7" x2="21" y2="21" />
          <line x1="21" y1="7" x2="7" y2="21" />
        </svg>
      </button>

      {/* Animated container */}
      <div className="lightbox__content" ref={contentRef}>
        {/* Scrollable interior */}
        <div className="lightbox__scroll" ref={scrollRef}>
          {/* ── 首图(2026-10-27 用户要求):卡片最顶部第一张图,全屏贴边(左右贴
              网页左右、无圆角,画幅 3840/2159 防 CLS)。2026-11-07 追加(仿空气
              炸锅 hero):四行元信息叠在左下角 + 底部滚动溶解(firstMeta/
              firstFade,见下)。其下直接是调研/设计问题/过程图,全部直接
              展示,不设展开按钮(按钮方案已否决)。 ── */}
          {project.firstImage && (
            <section ref={firstRef} className={`lightbox__first${project.firstFade ? ' lightbox__first--fade' : ''}`}>
              {/* 溶解蒙版容器:包住图+四行字,滚动离开时一起虚化(仿空气炸锅
                  heroFade);静态渐变遮罩与四行字都在其内,文字在遮罩之上
                  (遮罩 DOM 在前) */}
              <div className="lightbox__first-media">
                <figure className="lightbox__first-figure">
                  <img
                    src={project.firstImage}
                    alt=""
                    className="lqip-img"
                    style={lqStyle(project.firstImage)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                    srcSet={getSrcSet(project.firstImage)}
                    sizes={SIZES.full}
                  />
                </figure>
                {/* 图底垂直渐变遮罩(2026-10-27 用户要求):透明 → 白色
                    rgba(255,255,255,1) 100%,融合区域桌面 120-160px 长过渡,
                    渐变终点与下方白色调研区完全一致,无缝无分界线(2026-11-07
                    起:四行字移上首图、灰色字板块取消,终点由灰 209 改白);
                    纯静态,主体保持清晰,只在图底边缘淡出。 */}
                <div className="lightbox__first-fade" aria-hidden="true" />
                {/* 首图四行字(2026-11-07 用户要求,仿空气炸锅 hero):左下角
                    叠在首图上,桌面四行/≤768 单行;首屏直显,不参与滚动触发。
                    2026-11-08 用户要求:首图比视口高(≥16:9 宽视口图自然高
                    超屏)时四行字仍钉在第一屏左下角、不随图底掉到折叠线
                    以下——外包一层高 0 的 sticky 钉针(见 CSS),图底升到
                    视口底后随图一起滚走、随溶解带一起虚化 */}
                {project.firstMeta && (
                  <div className="lightbox__first-meta-pin">
                    <div className="lightbox__meta lightbox__meta--overlay lightbox__meta--overlay-inline">
                      <MetaRows project={project} />
                      <div className="lightbox__meta-line">
                        <span>{project.year}</span>
                        <span>{project.duration}</span>
                        <span>{project.type}</span>
                        <span>{project.skills}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Hero + Meta (shared background) ── */}
          <section ref={heroRef} className={`lightbox__hero${isLight ? ' lightbox__hero--light' : ''}${project.heroClass ? ` lightbox__hero--${project.heroClass}` : ''}${project.heroFade ? ' lightbox__hero--fade' : ''}`} style={{ background: heroBg }}>
            {/* 无英雄媒体(heroVideo/heroImage)的卡片不再渲染占位灰盒——
                2026-10-22 用户要求删除所有卡片内的空白内容,后续逐个补上 */}
            {(project.heroVideo || project.heroImage || project.metaInHero) && (
              <div className={`lightbox__hero-img${project.metaInHero ? ' lightbox__hero-img--overlay' : ''}${project.heroNoPadding ? ' lightbox__hero-img--no-pad' : ''}`}>
              {project.heroVideo ? (
                <>
                  <div className={`lightbox__hero-video-wrap${Array.isArray(project.tagline) ? ' lightbox__hero-video-wrap--side' : ''}`}>
                    <video
                      ref={videoRef}
                      className="lightbox__hero-video"
                      src={project.heroVideo}
                      poster={posterFor(project.heroVideo) || (isMobile ? project.image : undefined)}
                      autoPlay={!isMobile}
                      preload="metadata"
                      muted
                      playsInline
                      key={project.id}
                      style={{ background: heroBg }}
                      onEnded={() => { heroTextLocked.current = true; setVideoEnded(true); setMobileVideoPlaying(false) }}
                      onPlay={() => { if (!heroTextLocked.current) setVideoEnded(false); setMobileVideoPlaying(true) }}
                    />
                    {/* Mobile: poster cover + tap to play */}
                    {isMobile && !mobileVideoPlaying && (
                      <button
                        type="button"
                        className="lightbox__hero-play"
                        onClick={handleHeroVideoTap}
                        aria-label="播放视频"
                      >
                        <span className="lightbox__hero-play-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="8 5 19 12 8 19" />
                          </svg>
                        </span>
                      </button>
                    )}
                    {project.tagline && Array.isArray(project.tagline) && project.heroClass !== 'ring' && (
                      <div className={`lightbox__hero-tagline lightbox__hero-tagline--right${videoEnded ? ' lightbox__hero-tagline--visible' : ''}`}>
                        {project.tagline.map((line, i) => (
                          <span key={i} className="lightbox__hero-tagline-line" style={{ transitionDelay: `${i * 0.4}s` }}>
                            {line}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* 字符串 tagline(pendant-1):位于视频正下方、随 wrap 居中;
                        视频完整播完后淡入(opacity 0→1,800ms),故障 3s 兜底 */}
                    {project.tagline && !Array.isArray(project.tagline) && (
                      <p className={`lightbox__hero-tagline lightbox__hero-tagline--below${videoEnded ? ' lightbox__hero-tagline--visible' : ''}`}>
                        {project.tagline}
                      </p>
                    )}
                  </div>
                  {project.heroClass === 'ring' && project.tagline && Array.isArray(project.tagline) && (
                    <div className={`lightbox__hero-tagline lightbox__hero-tagline--right${videoEnded ? ' lightbox__hero-tagline--visible' : ''}`}>
                      {project.tagline.map((line, i) => (
                        <span key={i} className="lightbox__hero-tagline-line" style={{ transitionDelay: `${i * 0.4}s` }}>
                          {line}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : project.heroImage ? (
                <div className="lightbox__hero-image-wrap">
                  <img src={project.heroImage} alt={project.title} className="lightbox__hero-image" decoding="async" srcSet={getSrcSet(project.heroImage)} sizes={SIZES.full} />
                  {project.tagline && (
                    <div className={`lightbox__hero-tagline ${project.taglineRight ? 'lightbox__hero-tagline--right' : 'lightbox__hero-tagline--left'}${!project.heroVideo || videoEnded ? ' lightbox__hero-tagline--visible' : ''}`}>
                      {project.tagline.split('，').map((line, i) => (
                        <span key={i} className="lightbox__hero-tagline-line">{line}</span>
                      ))}
                    </div>
                  )}
                  {project.metaInHero && project.metaInHeroInline && (
                    <div className="lightbox__meta lightbox__meta--overlay lightbox__meta--overlay-inline">
                      <MetaRows project={project} />
                      <div className="lightbox__meta-line">
                        <span>{project.year}</span>
                        <span>{project.duration}</span>
                        <span>{project.type}</span>
                        <span>{project.skills}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              {project.metaInHero && !project.metaInHeroInline && (
                <div className="lightbox__meta lightbox__meta--overlay">
                  <MetaRows project={project} />
                  <div className="lightbox__meta-line">
                    <span>{project.year}</span>
                    <span>{project.duration}</span>
                    <span>{project.type}</span>
                    <span>{project.skills}</span>
                  </div>
                </div>
              )}
              </div>
            )}
            {/* Meta block — standalone (below hero);firstMeta(擦窗机)的
                四行字已移上首图,这里不再渲染 */}
            {!project.metaInHero && !project.firstMeta && (
              <div className={`lightbox__meta${project.metaInline ? ' lightbox__meta--inline' : ''}${project.metaImage ? ' lightbox__meta--with-image' : ''}${project.metaCenter ? ' lightbox__meta--center' : ''}`} data-reveal>
                {project.metaInline ? (
                  <p className="lightbox__meta-line">{project.year} · {project.duration} · {project.type} · {project.skills}</p>
                ) : (
                  <div className="lightbox__meta-content">
                    <MetaRows project={project} />
                    {project.metaImage && (
                      <div className="lightbox__meta-image">
                        {project.metaLink ? (
                          <a href={project.metaLink} target="_blank" rel="noopener noreferrer" className="lightbox__meta-image-link">
                            {/* 2026-11-15:meta 缩略图仅 max-width/max-height,加载前固有
                                尺寸 0×0,若开灯箱时在折叠线下 lazy 永不触发→永久不可见;
                                改 eager(灯箱首屏元素,480w webp 仅 ~11KB)。 */}
                            <img src={project.metaImage} alt="" decoding="async" srcSet={getSrcSet(project.metaImage)} sizes={SIZES.meta} />
                            <svg className="lightbox__meta-image-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 6 15 12 9 18" />
                            </svg>
                          </a>
                        ) : (
                          <>
                            <img src={project.metaImage} alt="" decoding="async" srcSet={getSrcSet(project.metaImage)} sizes={SIZES.meta} />
                            <svg className="lightbox__meta-image-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 6 15 12 9 18" />
                            </svg>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 使用人群差异化需求解读(棱光 pen-2 专属,2026-11-05 用户要求):
              首图(hero)下方黑底板块——中标题 + 图 1 版心宽,静态无动效 ── */}
          {project.id === 'pen-2' && <DemandReading />}

          {/* ── 色彩・材质・工艺 图文台阶滚动板块(pen-2 专属,2026-11-11):
              黑带标题钉住 + 6 阶左图右文交叉渐变,详见 CmfSteps ── */}
          {project.id === 'pen-2' && project.cmf && (
            <CmfSteps
              title={project.cmf.title}
              steps={project.cmf.steps}
              scrollContainerRef={scrollRef}
            />
          )}

          {/* ── 台阶滚动之后的整页大图(pen-2 专属,2026-11-13 用户要求:
              3-6 滚完后下一页面放图 4,页面大小=占满一屏)──
              深灰黑底衔接上方黑板块;静态无动效,reduced-motion 无需处理;
              2026-11-14 用户定稿:桌面 ≥1024 整页 100dvh cover 铺满;
              同日再改:<1024 完整 16:9 显示、页面宽度左右贴边、不裁切
              不压缩(见 Lightbox.css 媒体查询)。 ── */}
          {project.id === 'pen-2' && project.pageImage && (
            <section className="lightbox__page-image">
              <img
                src={project.pageImage}
                srcSet={getSrcSet(project.pageImage)}
                sizes={SIZES.full}
                alt="棱光钢笔渲染图"
                loading="lazy"
                decoding="async"
                style={getLqip(project.pageImage)
                  ? { backgroundImage: `url(${getLqip(project.pageImage)})`, backgroundSize: 'cover' }
                  : undefined}
              />
            </section>
          )}

          {/* ── 图 4 之后(2026-11-14 用户要求):半页黑底大标题
              「藏于方寸,落笔从容」居中;下方图 5 页面宽度左右贴边、
              响应式缩放、完整显示(静态无动效,四档同布局)── */}
          {project.id === 'pen-2' && project.pageImage2 && (
            <>
              <section className="lightbox__pen2-closing">
                <h2 className="lightbox__pen2-closing-title">{project.closingTitle}</h2>
              </section>
              <section className="lightbox__pen2-closing-image">
                <img
                  src={project.pageImage2}
                  srcSet={getSrcSet(project.pageImage2)}
                  sizes={SIZES.full}
                  alt="棱光钢笔收纳展示图"
                  loading="lazy"
                  decoding="async"
                  style={getLqip(project.pageImage2)
                    ? { backgroundImage: `url(${getLqip(project.pageImage2)})`, backgroundSize: 'cover' }
                    : undefined}
                />
              </section>
            </>
          )}

          {/* ── 图 5 之后(2026-11-15 用户要求):再来半页大标题「棱光」
              居中;图 6 版心宽度(2026-11-15 用户改:min(1400,vw−48)
              居中,响应式缩放、完整显示,静态无动效,四档同布局)── */}
          {project.id === 'pen-2' && project.pageImage3 && (
            <>
              <section className="lightbox__pen2-closing">
                <h2 className="lightbox__pen2-closing-title">{project.closingTitle2}</h2>
              </section>
              {/* ── 「棱光」标题与图 6 之间的小图 6-0(2026-11-15 用户要求):
                  居中,宽度比标题两个字大一点(标题 2 字≈2em,取 2.5em 同档缩放)── */}
              {project.midImage && (
                <section className="lightbox__pen2-mid">
                  <img
                    className="lightbox__pen2-mid-img"
                    src={project.midImage}
                    srcSet={getSrcSet(project.midImage)}
                    sizes="clamp(35px, 7vw, 90px)"
                    alt="棱光"
                    loading="lazy"
                    decoding="async"
                    style={getLqip(project.midImage)
                      ? { backgroundImage: `url(${getLqip(project.midImage)})`, backgroundSize: 'cover' }
                      : undefined}
                  />
                </section>
              )}
              <section className="lightbox__pen2-closing-image lightbox__pen2-closing-image--6">
                <img
                  src={project.pageImage3}
                  srcSet={getSrcSet(project.pageImage3)}
                  sizes={SIZES.board}
                  alt="棱光钢笔全貌展示图"
                  loading="lazy"
                  decoding="async"
                  style={getLqip(project.pageImage3)
                    ? { backgroundImage: `url(${getLqip(project.pageImage3)})`, backgroundSize: 'cover' }
                    : undefined}
                />
              </section>
              {/* ── 图 6 与视频 11 之间的小字(2026-11-15 用户要求):
                  黑底、居中对齐 ── */}
              {project.closingNote && (
                <section className="lightbox__pen2-note">
                  <p>{project.closingNote}</p>
                </section>
              )}
              {/* ── 图 6 下方视频 11(2026-11-15 用户要求):版心宽度、
                  与图 6 有间隔(现间隔由上方小字板块承担);黑底延续收尾区;
                  reduced-motion 不自动播 ── */}
              {project.closingVideo && (
                <section className="lightbox__pen2-closing-video">
                  <video
                    className="lightbox__pen2-closing-video-el"
                    src={project.closingVideo}
                    autoPlay={!reducedMotion}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="棱光钢笔视频"
                  />
                </section>
              )}
              {/* ── 视频 11 下方(2026-11-15 用户要求):大标题「钢笔拆解图」+
                  图 7;标题与图紧挨(8px),标题与视频留 clamp 间隙 ── */}
              {project.explodedImage && (
                <>
                  <h2 className="lightbox__pen2-explode-title">{project.explodedTitle}</h2>
                  <section className="lightbox__pen2-explode-img-sec">
                    <img
                      className="lightbox__pen2-explode-img"
                      src={project.explodedImage}
                      srcSet={getSrcSet(project.explodedImage)}
                      sizes={SIZES.board}
                      alt="钢笔拆解图"
                      loading="lazy"
                      decoding="async"
                      style={getLqip(project.explodedImage)
                        ? { backgroundImage: `url(${getLqip(project.explodedImage)})`, backgroundSize: 'cover' }
                        : undefined}
                    />
                  </section>
                  {/* ── 图 7 下方继续放图 8(2026-11-15 用户要求):
                      版心宽度、圆角 8px、与图 7 留 clamp 间隙 ── */}
                  {project.image8 && (
                    <section className="lightbox__pen2-explode-img-sec lightbox__pen2-explode-img-sec--8">
                      <img
                        className="lightbox__pen2-explode-img lightbox__pen2-explode-img--8"
                        src={project.image8}
                        srcSet={getSrcSet(project.image8)}
                        sizes={SIZES.board}
                        alt="钢笔拆解图"
                        loading="lazy"
                        decoding="async"
                        style={getLqip(project.image8)
                          ? { backgroundImage: `url(${getLqip(project.image8)})`, backgroundSize: 'cover' }
                          : undefined}
                      />
                    </section>
                  )}
                  {/* ── 图 8 下方继续放图 9(2026-11-15 用户要求):
                      同版心宽度、圆角 8px、与图 8 留 clamp 间隙 ── */}
                  {project.image9 && (
                    <section className="lightbox__pen2-explode-img-sec lightbox__pen2-explode-img-sec--9">
                      <img
                        className="lightbox__pen2-explode-img lightbox__pen2-explode-img--9"
                        src={project.image9}
                        srcSet={getSrcSet(project.image9)}
                        sizes={SIZES.board}
                        alt="钢笔拆解图"
                        loading="lazy"
                        decoding="async"
                        style={getLqip(project.image9)
                          ? { backgroundImage: `url(${getLqip(project.image9)})`, backgroundSize: 'cover' }
                          : undefined}
                      />
                    </section>
                  )}
                  {/* ── 最后放图 10(2026-11-15 用户要求):白色背景;
                      上方大标题「最终众筹价格」与「钢笔拆解图」同款样式,
                      标题与图紧挨(8px) ── */}
                  {project.finalTitle && project.finalImage && (
                    <section className="lightbox__pen2-final-sec">
                      <h2 className="lightbox__pen2-final-title">{project.finalTitle}</h2>
                      <img
                        className="lightbox__pen2-final-img"
                        src={project.finalImage}
                        srcSet={getSrcSet(project.finalImage)}
                        sizes={SIZES.board}
                        alt="最终众筹价格"
                        loading="lazy"
                        decoding="async"
                        style={getLqip(project.finalImage)
                          ? { backgroundImage: `url(${getLqip(project.finalImage)})`, backgroundSize: 'cover' }
                          : undefined}
                      />
                    </section>
                  )}
                  {/* ── 图 10 下方放图 11(2026-11-15 用户要求):全屏
                      (与图 4 同规:桌面 100dvh cover 铺满,<1024 完整贴边) ── */}
                  {project.image11 && (
                    <section className="lightbox__pen2-full11">
                      <img
                        src={project.image11}
                        srcSet={getSrcSet(project.image11)}
                        sizes={SIZES.full}
                        alt="棱光钢笔"
                        loading="lazy"
                        decoding="async"
                        style={getLqip(project.image11)
                          ? { backgroundImage: `url(${getLqip(project.image11)})`, backgroundSize: 'cover' }
                          : undefined}
                      />
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {/* ── ScrollWordReveal 图文联动滚动板块(卡片内第一个板块,2026-10-22)──
              左:固定图片区,与右栏文字共用同一 scrollYProgress,到达 snap 卡点
              一次性弹出切换(scale+fade,AnimatePresence 进出场),不随滚轮连续形变;
              右:逐词渐显。仅配置 scrollReveal 数据的卡片渲染(打火机首个使用)。 ── */}
          {project.scrollReveal && (
            <ScrollWordReveal
              text={project.scrollReveal.text}
              images={project.scrollReveal.images}
              kicker={project.scrollReveal.kicker}
              scrollContainerRef={scrollRef}
            />
          )}

          {/* ── 光视频板块(滚动文字板块之后,打火机专属,2026-10-22)──
              黑底;标题 + 循环视频铺满版心宽度 + 居中小字(三段)。
              2026-10-23 追加:小字最后一段下方全屏贴边大图(通栏、无圆角)。
              reduced-motion:视频不自动播放(preload 出首帧),关闭无限循环。 ── */}
          {project.scrollReveal?.followUp && (
            <section className="lightbox__light-demo">
              <div className="lightbox__light-demo-inner">
                <h2 className="lightbox__light-demo-title">{project.scrollReveal.followUp.heading}</h2>
                <video
                  className="lightbox__light-demo-video"
                  src={project.scrollReveal.followUp.video}
                  autoPlay={!reducedMotion}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={project.scrollReveal.followUp.heading}
                />
                <p className="lightbox__light-demo-caption">
                  {project.scrollReveal.followUp.caption.split('\n').map((line, i) => (
                    <span className="lightbox__light-demo-caption-line" key={i}>{line}</span>
                  ))}
                </p>
              </div>
              {/* 全屏贴边大图:出 inner 作 section 直接子元素才能通栏(inner
                  有版心 1400 + 侧留白);figure 无默认左右 margin;图内下部分
                  叠两段小字(figcaption 绝对定位,图底纯黑白字可读) */}
              {project.scrollReveal.followUp.image && (
                <figure className="lightbox__light-demo-figure">
                  <img
                    src={project.scrollReveal.followUp.image}
                    srcSet={getSrcSet(project.scrollReveal.followUp.image)}
                    sizes={SIZES.full}
                    alt=""
                    className="lightbox__light-demo-full lqip-img"
                    style={lqStyle(project.scrollReveal.followUp.image)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                  />
                  {project.scrollReveal.followUp.imageCaption && (
                    <figcaption className="lightbox__light-demo-figure-caption">
                      {project.scrollReveal.followUp.imageCaption.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </figcaption>
                  )}
                </figure>
              )}
              {/* 图 3(2026-10-23):版心宽 min(1400,vw−48) 居中,与上图
                  clamp(16,2.5vh,32) 间隙,圆角 8px(非贴边,全站圆角规则适用) */}
              {project.scrollReveal.followUp.image2 && (
                <figure className="lightbox__light-demo-figure2">
                  <img
                    src={project.scrollReveal.followUp.image2}
                    srcSet={getSrcSet(project.scrollReveal.followUp.image2)}
                    sizes={SIZES.board}
                    alt=""
                    className="lightbox__light-demo-img2 lqip-img"
                    style={lqStyle(project.scrollReveal.followUp.image2)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                  />
                </figure>
              )}
              {/* 图 3 下方中号字(2026-10-23)+其下图 4:黑底白字居中;
                  图 4 任何设备都左右贴边(2026-11-14 用户改),无圆角 */}
              {project.scrollReveal.followUp.quote && (
                <p className="lightbox__light-demo-quote">{project.scrollReveal.followUp.quote}</p>
              )}
              {project.scrollReveal.followUp.image3 && (
                <figure className="lightbox__light-demo-figure3">
                  <img
                    src={project.scrollReveal.followUp.image3}
                    srcSet={getSrcSet(project.scrollReveal.followUp.image3)}
                    sizes={SIZES.full}
                    alt=""
                    className="lightbox__light-demo-img3 lqip-img"
                    style={lqStyle(project.scrollReveal.followUp.image3)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                  />
                </figure>
              )}
              {/* 图 5(2026-10-23):图 4 下方版心宽图,顶部一行小字叠在图顶 */}
              {project.scrollReveal.followUp.image4 && (
                <figure className="lightbox__light-demo-figure4">
                  <img
                    src={project.scrollReveal.followUp.image4}
                    srcSet={getSrcSet(project.scrollReveal.followUp.image4)}
                    sizes={SIZES.board}
                    alt=""
                    className="lightbox__light-demo-img4 lqip-img"
                    style={lqStyle(project.scrollReveal.followUp.image4)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                  />
                  {project.scrollReveal.followUp.image4Caption && (
                    <figcaption className="lightbox__light-demo-figure4-caption">
                      {project.scrollReveal.followUp.image4Caption}
                    </figcaption>
                  )}
                </figure>
              )}
              {/* 图 6(2026-10-23):图 5 下方,左右贴住网页两边(全屏贴边无圆角) */}
              {project.scrollReveal.followUp.image5 && (
                <figure className="lightbox__light-demo-figure5">
                  <img
                    src={project.scrollReveal.followUp.image5}
                    srcSet={getSrcSet(project.scrollReveal.followUp.image5)}
                    sizes={SIZES.full}
                    alt=""
                    className="lightbox__light-demo-full5 lqip-img"
                    style={lqStyle(project.scrollReveal.followUp.image5)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                  />
                </figure>
              )}
            </section>
          )}

          {/* ── Opening statement — 开场白叠放在全幅大图上端 + 上下渐变 ──
              全幅图不参与滚动触发(reveal 只挂在文字上),左右铺满的
              图片始终直显;未来新增全幅图沿用此约定 + DENY_SELECTORS 兜底 ── */}
          {project.statement && (
            <section className={`lightbox__statement${project.id === 'pendant-1' ? ' lightbox__statement--dark-tail' : ''}`}>
              {project.statement.image ? (
                <div className="lightbox__statement-img-wrap">
                  <p className="lightbox__statement-text" data-reveal>{project.statement.text}</p>
                  <img
                    src={project.statement.image}
                    alt=""
                    className="lightbox__statement-img lqip-img"
                    style={lqStyle(project.statement.image)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                    srcSet={getSrcSet(project.statement.image)}
                    sizes={SIZES.full}
                  />
                </div>
              ) : (
                <p className="lightbox__statement-text" data-reveal>{project.statement.text}</p>
              )}
            </section>
          )}

          {/* ── 亮度衰减图表(氚管灯专属):statement 图下方白色区块 ── */}
          {project.id === 'pendant-1' && (
            <BrightnessCharts />
          )}

          {/* ── Detail sections — hidden for minimal projects ── */}
          {!project.minimal && (<>
          {/* ── Research — only for projects that provide research data ── */}
          {project.research && project.research.length > 0 && (
            <div className="lightbox__research-group">
              {project.research.map((item, i) => {
                const images = (item.images || []).filter((img) => img.src)
                return (
                item.goal ? (
                  <section className="lightbox__goal" key={i} data-reveal>
                    <h3 className="lightbox__goal-title">{item.goal.heading}</h3>
                    {item.goal.text && (
                      <p className="lightbox__goal-text">{highlightWords(item.goal.text, item.goal.highlights)}</p>
                    )}
                  </section>
                ) : item.pest ? (
                  <Pest key={i} pest={item.pest} />
                ) : item.layout === 'narrative' ? (
                  <Narrative key={i} narrative={item.narrative} />
                ) : (
                <section className="lightbox__research" key={i} data-reveal>
                <div className={`lightbox__research-inner${item.layout ? ` lightbox__research-inner--${item.layout}` : ''}`}>
                  {/* Text block */}
                  <div className="lightbox__insight-text">
                    {item.label && <p className="lightbox__insight-label">{item.label}</p>}
                    <p className="lightbox__insight">{item.insight || item.title}</p>
                    {item.caption && <p className="lightbox__insight-caption">{item.caption}</p>}
                  </div>
                  {/* Image block */}
                  {images.length > 0 && (
                    <div className={`lightbox__insight-images${images.length >= 2 ? ' lightbox__insight-images--pair' : ' lightbox__insight-images--single'}`}>
                      {images.map((img, j) => (
                        <div key={j} className={`lightbox__insight-img lightbox__insight-img--${img.ratio || 'wide'}${img.fit ? ` lightbox__insight-img--${img.fit}` : ''}`}>
                          <img
                            src={img.src}
                            alt=""
                            className="lightbox__img lqip-img"
                            style={lqStyle(img.src)}
                            loading="lazy"
                            decoding="async"
                            onLoad={markLoaded}
                            onError={markLoaded}
                            ref={loadedRef}
                            srcSet={getSrcSet(img.src)}
                            sizes={SIZES.wide}
                            {...(img.w && img.h ? { width: img.w, height: img.h } : {})}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
                )
              )
            })}
            </div>
          )}

          {/* ── Design Question ── 灰色底板块:背景固定静止不参与动效,
              只文字滚入触发(2026-11-07 用户要求,全局规则) ── */}
          {project.designQuestion && (
            <section className="lightbox__design-question">
              <div className="lightbox__design-question-inner" data-reveal>
                <p className="lightbox__design-question-text">
                  {(() => {
                    const { text, highlights } = project.designQuestion
                    if (!highlights || highlights.length === 0) return text
                    const pattern = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
                    const regex = new RegExp(`(${pattern})`, 'g')
                    const parts = text.split(regex)
                    return parts.map((part, i) =>
                      highlights.includes(part)
                        ? <span key={i} className="lightbox__design-question-highlight">{part}</span>
                        : part
                    )
                  })()}
                </p>
              </div>
            </section>
          )}

          {/* ── Design Process — only for projects that provide a process image ──
              展开区块内的三个空槽已随「删除卡片内空白内容」移除(2026-10-22),
              后续补上真实过程图时再恢复展开结构 */}
          {project.processImage && (
            <section className="lightbox__process">
              <div className="lightbox__process-inner">
                {/* 背景图(图 11):只图滚入触发,灰色板块背景固定静止
                    (2026-11-07 用户要求,全局规则);展开按钮不参与动效 */}
                <div className="lightbox__process-img-wrap" data-reveal>
                  <img src={project.processImage} alt="" className="lightbox__img" loading="lazy" decoding="async" srcSet={getSrcSet(project.processImage)} sizes={SIZES.wide} />
                </div>
              </div>
              {/* ── 展开显示完整过程(2026-11-07 用户要求,当天两改):按钮
                  浮在背景.png(图 11)上,圆心钉在图 11 消失线上(图片被底部
                  渐变带遮住的起始线,位置见 Lightbox.css --process-fade),
                  不占独立板块、不撑开任何间距——背景板块与下方板块直接
                  相连;点击一次性展开背景图之后的其余内容(两张图,src 为
                  空时渲染浅灰虚线占位槽,后续用户替换真实文件)。现有内容
                  (首图/调研/设计问题/背景图)全部保持直接展示,不收
                  起。展开为点击驱动的一次性交互,非滚动动效;四档同布局;
                  reduced-motion 下箭头弹跳停、展开过渡瞬时(见 Lightbox.css)。 ── */}
              {project.processImages?.length > 0 && !processExpanded && (
                <div className="lightbox__process-toggle">
                  <button
                    type="button"
                    className="lightbox__process-expand"
                    onClick={() => setProcessExpanded(true)}
                    aria-label="展开显示完整过程"
                  >
                    <svg className="lightbox__process-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <span className="lightbox__process-text">展开显示完整过程</span>
                </div>
              )}
            </section>
          )}

          {/* ── 展开内容槽位:背景板块与下方板块之间,收起态高 0 不占位,
              展开后把下方板块顺推下去 ── */}
          {project.processImages && project.processImages.length > 0 && (
            <div
              className={`lightbox__process-slots${processExpanded ? ' lightbox__process-slots--expanded' : ''}`}
              aria-hidden={!processExpanded}
            >
              <div className="lightbox__process-inner">
                {project.processImages.map((src, i) => (
                  <figure className="lightbox__process-slot" key={i}>
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        className="lightbox__img lqip-img"
                        style={lqStyle(src)}
                        loading="lazy"
                        decoding="async"
                        onLoad={markLoaded}
                        onError={markLoaded}
                        ref={loadedRef}
                        srcSet={getSrcSet(src)}
                        sizes={SIZES.board}
                      />
                    ) : (
                      <div className="lightbox__process-slot-ph" aria-hidden="true" />
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* ── Full-page image (目标下方全景图) — 铺满整页的全幅大图 ──
              全幅图不参与滚动触发,始终直显(与 statement 图同一约定) ── */}
          {project.fullPageImage && (
            <section className="lightbox__fullpage">
              <img src={project.fullPageImage} alt="" className="lightbox__fullpage-img lqip-img" style={lqStyle(project.fullPageImage)} loading="lazy" decoding="async" onLoad={markLoaded} onError={markLoaded} ref={loadedRef} srcSet={getSrcSet(project.fullPageImage)} sizes={SIZES.full} />
            </section>
          )}

          {/* ── Showcase — only for projects that provide showcase items ──
              无 showcase 数据的卡片原先渲染 3 个空占位块,已随
              「删除卡片内空白内容」移除(2026-10-22) */}
          {project.showcase && project.showcase.length > 0 && (
            <section className="lightbox__showcase">
              <div className="lightbox__showcase-inner">
                <div className="lightbox__showcase-grid" data-reveal-group data-reveal-once>
                  {project.showcase.map((item, i) => {
                    // Video + text: split layout — video left, text right
                    if (item?.type === 'video' && item.src && (item.title || item.text)) {
                      return (
                        <div key={i} className="lightbox__showcase-split">
                          <div className="lightbox__showcase-video-box">
                            <video
                              className="lightbox__showcase-video"
                              data-src={item.src}
                              poster={posterFor(item.src)}
                              preload="metadata"
                              muted
                              loop
                              playsInline
                              onLoadedData={paintFirstFrame}
                            />
                          </div>
                          <div className="lightbox__showcase-text">
                            {item.title && <h3 className="lightbox__showcase-text-title">{item.title}</h3>}
                            {item.text && item.text.split('\n').map((line, i) => (
                              <p key={i} className="lightbox__showcase-text-body">{line}</p>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    if (item?.type === 'video' && item.src) {
                      return (
                        <div key={i} className="lightbox__showcase-img">
                          <video
                            className="lightbox__showcase-video"
                            data-src={item.src}
                            poster={posterFor(item.src)}
                            preload="metadata"
                            muted
                            loop
                            playsInline
                            onLoadedData={paintFirstFrame}
                          />
                        </div>
                      )
                    }
                    if (item?.src) {
                      return (
                        <div key={i} className="lightbox__showcase-img">
                          <img src={item.src} alt="" className="lightbox__img lqip-img" style={lqStyle(item.src)} loading="lazy" decoding="async" onLoad={markLoaded} onError={markLoaded} ref={loadedRef} srcSet={getSrcSet(item.src)} sizes={SIZES.wide} />
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── 短小精悍(2026-10-23):showcase 下方白底板块——大标题 +
              7/8 两图并排,两张合计版心宽 min(1400,vw−48),圆角 8px ── */}
          {project.compact && project.compact.images?.length > 0 && (
            <section className="lightbox__compact">
              <div className="lightbox__compact-inner">
                {project.compact.heading && <h2 className="lightbox__compact-title">{project.compact.heading}</h2>}
                <div className="lightbox__compact-grid">
                  {project.compact.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="lightbox__compact-img lqip-img"
                      style={lqStyle(src)}
                      loading="lazy"
                      decoding="async"
                      onLoad={markLoaded}
                      onError={markLoaded}
                      ref={loadedRef}
                      srcSet={getSrcSet(src)}
                      sizes={SIZES.half}
                    />
                  ))}
                </div>
                {/* 图 9(2026-10-23):7/8 下方版心全宽图,左下角叠一行小字 */}
                {project.compact.image9 && (
                  <figure className="lightbox__compact-figure9">
                    <img
                      src={project.compact.image9}
                      alt=""
                      className="lightbox__compact-img9 lqip-img"
                      style={lqStyle(project.compact.image9)}
                      loading="lazy"
                      decoding="async"
                      onLoad={markLoaded}
                      onError={markLoaded}
                      ref={loadedRef}
                      srcSet={getSrcSet(project.compact.image9)}
                      sizes={SIZES.board}
                    />
                    {project.compact.image9Caption && (
                      <figcaption className="lightbox__compact-figure9-caption">
                        {project.compact.image9Caption}
                      </figcaption>
                    )}
                  </figure>
                )}
                {/* 图 10-13(2026-10-24):图 9 下方两行四图(2×2),与 7/8/9 统一
                    小缝隙;每图悬停轻微放大(transform-only,触屏 :active 等价、
                    reduced-motion 关闭——动效响应式规范 v1) */}
                {project.compact.images2?.length > 0 && (
                  <div className="lightbox__compact-grid2">
                    {project.compact.images2.map((src, i) => (
                      <figure key={i} className="lightbox__compact-figure2x2">
                        <img
                          src={src}
                          alt=""
                          className="lightbox__compact-img2x2 lqip-img"
                          style={lqStyle(src)}
                          loading="lazy"
                          decoding="async"
                          onLoad={markLoaded}
                          onError={markLoaded}
                          ref={loadedRef}
                          srcSet={getSrcSet(src)}
                          sizes={SIZES.half}
                        />
                      </figure>
                    ))}
                  </div>
                )}
                {/* 图 10-13 与视频 5 之间说明段(2026-11-07 用户要求):
                    居中对齐、普通字档、两行文案(pre-line 换行) */}
                {project.compact.images2Note && (
                  <p className="lightbox__compact-grid2-note">{project.compact.images2Note}</p>
                )}
                {/* 视频 5(2026-10-23):图 9 下方版心全宽,一直循环播放;
                    reduced-motion 时不自动播(规范 v1),首帧仍显示 */}
                {project.compact.video && (
                  <div className="lightbox__compact-video-box">
                    <video
                      className="lightbox__compact-video"
                      src={project.compact.video}
                      poster={posterFor(project.compact.video)}
                      autoPlay={!reducedMotion}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onLoadedData={paintFirstFrame}
                    />
                  </div>
                )}
                {/* 图 16(2026-11-11 用户要求):视频 5 下方版心宽大图,
                    上方大标题「最终众筹价格」——与钢笔式毛笔 trailing 标题
                    同款样式(复用同两个类,字体/字号/字重/橙色下划线一致) */}
                {project.compact.image16 && (
                  <>
                    {project.compact.image16Title && (
                      <h2 className="lightbox__finalstack-trailing-title lightbox__compact-price-title" data-reveal>
                        <span className="lightbox__finalstack-title-text">{project.compact.image16Title}</span>
                      </h2>
                    )}
                    <figure className="lightbox__compact-figure16">
                      <img
                        src={project.compact.image16}
                        alt=""
                        className="lightbox__compact-img16 lqip-img"
                        style={lqStyle(project.compact.image16)}
                        loading="lazy"
                        decoding="async"
                        onLoad={markLoaded}
                        onError={markLoaded}
                        ref={loadedRef}
                        srcSet={getSrcSet(project.compact.image16)}
                        sizes={SIZES.board}
                      />
                    </figure>
                  </>
                )}
              </div>
              {/* 图 15/14(2026-10-24 改):视频 5 下方全屏贴边大图,15 在上、火焰图
                  14 在下,两张叠放(--fade-h/2 重叠),15 内渐变黑遮罩压在交界处:
                  上透明→中间纯黑→下透明,上图底隐入下图顶,无边框无间隙;
                  出 inner 作 section 直接子元素,贴边无圆角(同 2-1/图2 先例),
                  LQIP + 懒加载 + aspect-ratio 防 CLS */}
              {project.compact.image15 && (
                <figure className="lightbox__compact-figure15">
                  <img
                    src={project.compact.image15}
                    alt=""
                    className="lightbox__compact-img15 lqip-img"
                    style={lqStyle(project.compact.image15)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                    srcSet={getSrcSet(project.compact.image15)}
                    sizes={SIZES.board}
                  />
                  {/* 融合渐变遮罩:15 底与 14 顶的交界渐变黑(纯 CSS,无 JS) */}
                  <div className="lightbox__compact-fade" aria-hidden="true" />
                </figure>
              )}
              {project.compact.image14 && (
                <figure className="lightbox__compact-figure14">
                  <img
                    src={project.compact.image14}
                    alt=""
                    className="lightbox__compact-img14 lqip-img"
                    style={lqStyle(project.compact.image14)}
                    loading="lazy"
                    decoding="async"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                    srcSet={getSrcSet(project.compact.image14)}
                    sizes={SIZES.board}
                  />
                </figure>
              )}
            </section>
          )}

          {/* ── Final showcase — sticky stacking cards (FinalStack), between
              the feature videos and the closing image. Each card is the same
              size as the showcase module above; cards slide out one by one
              on scroll, the covered one shrinking as the next lands. ── */}
          {project.finalGrid && project.finalGrid.images?.length > 0 && (
            <FinalStack images={project.finalGrid.images} title={project.finalGrid.title} trailingTitle={project.finalGrid.trailingTitle} trailingImage={project.finalGrid.trailingImage} />
          )}

          {/* ── Closing images — full-bleed at their own aspect ratio, after
              everything else the project has to say. These are kept at full
              resolution (no downscaling, no lossy re-encode), so they are heavy;
              lazy loading keeps that weight out of the page's initial load — the
              file is only fetched once the reader is near the bottom. ── */}
          {project.endImages?.length > 0 && (
            <section className="lightbox__endimages">
              {project.endImages.map((img, i) => {
                // Entries are either a plain path or { src, w, h }. Carrying the
                // pixel dimensions lets the browser reserve the right amount of
                // space up front — without them the section is 0px tall until the
                // file lands, and the footer jumps down by a full image height.
                const src = typeof img === 'string' ? img : img.src
                const dim = typeof img === 'string' ? {} : { width: img.w, height: img.h }
                return (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="lightbox__endimages-img lqip-img"
                    style={lqStyle(src)}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onLoad={markLoaded}
                    onError={markLoaded}
                    ref={loadedRef}
                    srcSet={getSrcSet(src)}
                    sizes={SIZES.full}
                    {...dim}
                  />
                )
              })}
            </section>
          )}

          </>)}

          {/* Footer spacer — 产品名字常驻,不参与滚动触发(用户要求) */}
          <div className="lightbox__footer">
            <p className="lightbox__footer-text">{project.title} · Industrial Design</p>
          </div>

          {/* ── Related Works Carousel ── */}
          {N > 1 && (
            <section className="lightbox__related">
              <div className="lightbox__related-inner">
                {/* 旋转木马区标题与产品名一样常驻,不参与滚动触发(用户要求) */}
                <h2 className="lightbox__section-heading">浏览其他作品</h2>
                <div className="lightbox__related-carousel">
                  <RelatedCarousel
                    key={project.id}
                    projects={projects}
                    initialIndex={typeof relatedCenterIdx === 'number' ? Math.min(relatedCenterIdx, Math.max(projects.length - 1, 0)) : 0}
                    onSelect={handleNavigate}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default Lightbox
