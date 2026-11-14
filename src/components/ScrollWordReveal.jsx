import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import './ScrollWordReveal.css'

// ── 图文联动滚动板块(2026-10-22,打火机卡片第一个板块) ──
// 左:固定图片区——图片数组一一对应文字关键节点,由同一 scrollYProgress
//    驱动;进度到达预设 snap 卡点时一次性弹出切换(scale+fade),卡在当前
//    滚动位置,不随滚轮连续形变;细指针设备滚轮滚停后自动吸附到最近卡点。
// 右:逐词渐显——沿用 reference ScrollWordReveal 的透明度映射逻辑
//    (REST 0.15 / REVEAL_SPAN 0.8 / WORD_WINDOW 0.2),原逻辑不动。
//    支持多段落(空行分隔):每段首行空两格、段间空一行,词索引全局连续。
// 响应式:长文排版——桌面/平板按视口高度收敛字号,保证整段文字落在
//    100svh sticky 面板内;手机(<640)图区吸附在视口顶部、文字自然流动,
//    进度改由文字块「进入视口底→离开视口底」映射,每个词都在可见区渐显。
// 无障碍:reduced-motion 与矮视口(横屏,<560px)完全静态展示;
//         无 JS 时文字无 opacity 初始态,内容完整呈现。

const REST_OPACITY = 0.15
const REVEAL_SPAN = 0.8
const WORD_WINDOW = 0.2
const SNAP_PROXIMITY = 0.06 // 滚停后距卡点的吸附半径上限(进度单位)

export function getWordRange(index, count) {
  const start = count <= 1 ? 0 : (index / (count - 1)) * REVEAL_SPAN
  return { start, end: Math.min(1, start + WORD_WINDOW) }
}

export function getWordOpacity(progress, { start, end }, rest = REST_OPACITY) {
  if (progress <= start) return rest
  if (progress >= end) return 1
  const t = (progress - start) / (end - start)
  return rest + (1 - rest) * t
}

function Word({ children, progress, index, count, staticMode }) {
  const range = getWordRange(index, count)
  const opacity = useTransform(progress, (value) => getWordOpacity(value, range))
  return (
    <motion.span aria-hidden="true" style={staticMode ? undefined : { opacity }}>
      {children}
    </motion.span>
  )
}

// 配置数组规整:snap 缺省时由 wordIndex 推得(该词渐显区间的起点);
// 第一项恒为 0、整体严格递增,保证 useTransform 输入单调。
function normalizeImages(images, wordCount) {
  const withSnap = images.map((img, i) => {
    let snap = img.snap
    if (typeof snap !== 'number') {
      snap = img.wordIndex != null
        ? getWordRange(img.wordIndex, wordCount).start
        : i / Math.max(1, images.length)
    }
    return { ...img, snap }
  })
  withSnap.sort((a, b) => a.snap - b.snap)
  withSnap.forEach((img, i) => {
    if (i === 0) img.snap = 0
    else if (img.snap <= withSnap[i - 1].snap) img.snap = Math.min(1, withSnap[i - 1].snap + 0.05)
  })
  return withSnap
}

/**
 * @param {object} props
 * @param {string} props.text  空格分隔的词组串(中文按词组空格分隔);
 *                             多段落以空行(\n\n)分隔,每段首行空两格、段间空一行
 * @param {Array<{wordIndex?: number, src: string, alt?: string, snap?: number}>} props.images
 * @param {string} [props.kicker]
 * @param {import('react').RefObject<HTMLElement>} [props.scrollContainerRef]
 *   滚动容器 ref(卡片内传 .lightbox__scroll);缺省用 window 滚动
 */
export default function ScrollWordReveal({ text, images = [], kicker = '滚动阅读', scrollContainerRef }) {
  const targetRef = useRef(null)
  const headingRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  // 矮视口(横屏手机等):与 reduced-motion 同样退化为静态展示
  const [shortViewport, setShortViewport] = useState(
    () => window.matchMedia('(max-height: 560px)').matches
  )
  // 手机(<768):长文不塞进 100svh 面板,图区吸附视口顶部、文字流动;
  //   2026-11-14 用户:全站 <768 禁用 JS 滚动定格动效 → 静态排版
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 767px)').matches
  )
  const staticMode = !!reducedMotion || shortViewport || isMobile

  useEffect(() => {
    const mqShort = window.matchMedia('(max-height: 560px)')
    const mqMobile = window.matchMedia('(max-width: 767px)')
    const onChange = () => {
      setShortViewport(mqShort.matches)
      setIsMobile(mqMobile.matches)
    }
    mqShort.addEventListener('change', onChange)
    mqMobile.addEventListener('change', onChange)
    return () => {
      mqShort.removeEventListener('change', onChange)
      mqMobile.removeEventListener('change', onChange)
    }
  }, [])

  // 同一滚动源:图文共用这一个 scrollYProgress,严格同步。
  // 桌面/平板:以整段 section(300vh + sticky 面板)为 target;
  // 手机:以文字块为 target,进度 = 文字进入视口底 → 离开视口底,
  //       每个词都在可见区域内渐显,图卡点随同一进度切换。
  const desktopScroll = useScroll({
    container: scrollContainerRef,
    target: targetRef,
    offset: OFFSET,
  })
  const mobileScroll = useScroll({
    container: scrollContainerRef,
    target: headingRef,
    offset: OFFSET_FLOW,
  })
  const scrollYProgress = isMobile ? mobileScroll.scrollYProgress : desktopScroll.scrollYProgress

  // 多段文本:按空行分段;词索引全局连续,透明度映射与单段完全一致
  const paragraphs = useMemo(
    () => text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.split(/\s+/).filter(Boolean)),
    [text]
  )
  const words = useMemo(() => paragraphs.flat(), [paragraphs])
  const paraOffsets = useMemo(() => {
    const offs = []
    let n = 0
    paragraphs.forEach((p) => {
      offs.push(n)
      n += p.length
    })
    return offs
  }, [paragraphs])
  const items = useMemo(() => normalizeImages(images, words.length), [images, words.length])
  const snaps = useMemo(() => items.map((i) => i.snap), [items])

  // motion snap:同一 scrollYProgress 上预设卡点,直接取阶跃索引——
  // 区间内输出恒定,图片不随滚轮连续形变,到达卡点即吸附锁定切换
  // (不用 useTransform 多段映射:其区间内是线性插值,不是阶跃)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    let idx = 0
    for (let i = snaps.length - 1; i >= 0; i--) {
      if (v >= snaps[i]) { idx = i; break }
    }
    setIndex(idx)
  })

  // 图片一次性预载:卡点切换时直接弹出,不闪空白
  useEffect(() => {
    items.forEach((img) => {
      const im = new Image()
      im.src = img.src
    })
  }, [items])

  // ── 滚停吸附:细指针设备(滚轮/触控板)滚动结束后,距卡点足够近时
  //    平滑吸附锁定;触屏不做物理吸附(避免与惯性滚动打架),
  //    手机流动布局(非 sticky,进度映射不同)与 reduced-motion /
  //    静态模式一律关闭。 ──
  useEffect(() => {
    if (staticMode || isMobile || snaps.length < 2) return
    const el = targetRef.current
    const cont = scrollContainerRef?.current || null
    if (!el || !cont) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const supportsScrollEnd = 'onscrollend' in window
    let debounce
    // 吸附半径自适应:不超过相邻卡点最小间距的 1/3,保证卡点之间
    // 始终存在"自由区",滚停后不会被大半径磁吸抢走
    let minGap = Infinity
    for (let i = 1; i < snaps.length; i++) minGap = Math.min(minGap, snaps[i] - snaps[i - 1])
    const proximity = Math.min(SNAP_PROXIMITY, minGap / 3)

    const snapToNearest = () => {
      const cRect = cont.getBoundingClientRect()
      const sRect = el.getBoundingClientRect()
      const range = sRect.height - cRect.height
      if (range <= 0) return
      const start = sRect.top - cRect.top + cont.scrollTop
      const progress = (cont.scrollTop - start) / range
      if (progress < 0.02 || progress > 0.98) return
      let best = null
      for (const s of snaps) {
        const d = Math.abs(progress - s)
        if (d <= proximity && (!best || d < best.d)) best = { d, s }
      }
      if (!best) return
      // 目标点越过卡点 1px:Chrome 平滑滚动按整数像素取整,恰落在卡点
      // 下方(如 0.5738 < 0.574)会让阶跃索引停在上一张,图片不翻页
      const targetTop = start + best.s * range + 1
      if (Math.abs(cont.scrollTop - targetTop) < 1) return
      cont.scrollTo({ top: targetTop, behavior: 'smooth' })
    }

    const onScrollEnd = () => snapToNearest()
    const onScroll = () => {
      if (supportsScrollEnd) return
      clearTimeout(debounce)
      debounce = setTimeout(snapToNearest, 260)
    }
    cont.addEventListener('scrollend', onScrollEnd)
    cont.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cont.removeEventListener('scrollend', onScrollEnd)
      cont.removeEventListener('scroll', onScroll)
      clearTimeout(debounce)
    }
  }, [staticMode, isMobile, snaps, scrollContainerRef])

  if (!items.length) return null

  const counter = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`

  return (
    <section className={`swr${staticMode ? ' swr--static' : ''}`} ref={targetRef}>
      <div className="swr__inner">
        {/* ── 左:固定图片区 ── */}
        <div className="swr__media">
          {staticMode ? (
            <div className="swr__media-static">
              {items.map((img, i) => (
                <figure className="swr__card" key={i}>
                  <img
                    src={img.src}
                    alt={img.alt || ''}
                    className="swr__card-img"
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>
          ) : (
            <div className="swr__media-sticky">
              <div className="swr__frame">
                <AnimatePresence initial={false}>
                  <motion.img
                    key={index}
                    src={items[index].src}
                    alt={items[index].alt || ''}
                    className="swr__frame-img"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.25, ease: 'easeOut' } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.9 }}
                    decoding="async"
                  />
                </AnimatePresence>
                <span className="swr__counter" aria-hidden="true">{counter}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 右:逐词渐显文字(原透明度映射逻辑不动) ── */}
        <div className="swr__content">
          <p className="swr__kicker">{kicker}</p>
          <div className="swr__heading-row">
            <div className="swr__progress" aria-hidden="true">
              <motion.span style={{ scaleY: staticMode ? 1 : scrollYProgress }} />
            </div>
            <h2 className="swr__heading" ref={headingRef} aria-label={text}>
              {paragraphs.map((para, p) => (
                <span className="swr__para" key={p}>
                  {para.map((word, wi) => {
                    const gi = paraOffsets[p] + wi
                    return (
                      // 中文词间不插空格:字距保持连续,整段文字无缝排版,
                      // 渐显仍按词组推进(每词整体渐显,词间无空隙)
                      <Word
                        key={`${word}-${wi}`}
                        progress={scrollYProgress}
                        index={gi}
                        count={words.length}
                        staticMode={staticMode}
                      >
                        {word}
                      </Word>
                    )
                  })}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </div>
    </section>
  )
}

const OFFSET = ['start start', 'end end']
// 手机长文流动布局:文字块顶进入视口底 → 文字块底到达视口底(行程 = 文字块高度)
const OFFSET_FLOW = ['start end', 'end end']
