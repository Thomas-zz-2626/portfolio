import { OSS } from '../assetBase.js'
import { useState, useCallback, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initReveal } from '../scrollReveal'
import { getSrcSet, SIZES } from '../imageSrc'
import { HI_PATHS, HI_VIEWBOX } from './logoPaths'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { number: '2', count: 2, suffix: '', label: '年经验' },
  { number: '30+', count: 30, suffix: '+', label: '已完成项目' },
  { number: '1w+', count: 1, suffix: 'w+', label: '销量' },
  { number: '500w+', count: 500, suffix: 'w+', label: '销售额' },
]

const PANELS = [
  {
    id: 'intro',
    label: '自我介绍',
    subtitle: 'Industrial Designer',
    content: (
      <>
        <p className="about__greeting">
          {/* 线框 SVG logo(2026-10-22 用户要求):与首页 logic. 同款真实字形
              轮廓路径;点击 emoji 彩带事件经 closest('.about__greeting-hi') 照常命中 */}
          <span className="about__greeting-hi">
            <svg
              className="about__greeting-hi-svg"
              viewBox={HI_VIEWBOX}
              role="img"
              aria-label="Hi"
              focusable="false"
            >
              {HI_PATHS.map((p, i) => (
                <path key={i} d={p.d} />
              ))}
            </svg>
          </span>我是Thomas，<br />
          一名独立工业设计师。
        </p>
        <p className="about__bio">
          专注于工业设计与产品创新，在功能理性与美学表达之间寻找平衡。
        </p>
        <p className="about__bio">
          作品涵盖消费电子、家居用品、EDC 随身装备等多个品类，
          始终以用户需求为出发点，将洞察转化为可落地的产品方案。
          擅长从前期调研、概念草图到三维建模、CMF 定义的全流程设计，
          也具备结构优化与打样跟进的一线经验。
        </p>
        <p className="about__bio">
          相信好的设计无需解释——<br />
          它自然地融入生活，让复杂变简单，让日常更有温度。
        </p>
      </>
    ),
  },
  {
    id: 'work',
    label: '工作经历',
    subtitle: 'Work Experience',
    content: (
      <div className="about__timeline" data-reveal-group>
        <div className="about__timeline-item">
          <div className="about__timeline-dot" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">工业设计师</h4>
            <p className="about__timeline-sub">西安艾克派创新有限公司 · 2025.9 — 至今</p>
            <p className="about__timeline-desc">
              负责 EDC 产品全流程设计，三款产品在 Kickstarter 上众筹超百万人民币。
            </p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__timeline-dot" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">产品外观设计师</h4>
            <p className="about__timeline-sub">中山市尚来工业设计有限公司 · 2025.2 — 2025.7</p>
            <p className="about__timeline-desc">
              调研、草图、建模、渲染以及交付设计方案。
            </p>
          </div>
        </div>
        <div className="about__timeline-item about__timeline-item--dashed about__timeline-item--break">
          <div className="about__timeline-dot about__timeline-dot--hollow" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">外观设计师（项目）</h4>
            <p className="about__timeline-sub">上海图书馆可编辑家具设计 · 2025.5 — 2025.9</p>
            <p className="about__timeline-desc">
              设计可供用户自行编辑的展厅方案，把移动家具像拼乐高一样简单快捷。
            </p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__timeline-dot" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">汽车摄影剪辑</h4>
            <p className="about__timeline-sub">中山市徕色汽车贴膜 · 2023.4 — 2023.6</p>
            <p className="about__timeline-desc">
              调试设备及拍摄口播和 B-roll，协助客户了解产品信息，清洁车辆及完善车辆信息。
            </p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__timeline-dot" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">摄影助理</h4>
            <p className="about__timeline-sub">中山市大蔚传媒有限公司 · 2023.1 — 2023.3</p>
            <p className="about__timeline-desc">
              每日场景设计及调整机位灯光，外出布景及拍摄产品，迎接客户及收集客户信息。
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'education',
    label: '教育经历',
    subtitle: 'Education',
    content: (
      <div className="about__timeline" data-reveal-group>
        <div className="about__timeline-item">
          <div className="about__timeline-dot" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">环境设计 本科</h4>
            <p className="about__timeline-sub">广东培正学院 · 2023.9 — 2025.6</p>
            <p className="about__timeline-desc">
              主修环境设计，涵盖空间规划、景观设计与室内设计，
              培养了从概念方案到施工落地的系统设计思维，具备跨尺度的空间营造能力。
            </p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__timeline-dot about__timeline-dot--hollow" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">软件进修</h4>
            <p className="about__timeline-sub">品创设计教育 · 2023.6 — 2023.8</p>
            <p className="about__timeline-desc">
              系统学习犀牛建模、KeyShot 渲染等 CAD 技能，强化三维表现能力。
            </p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__timeline-dot" />
          <div className="about__timeline-body">
            <h4 className="about__timeline-title">工业设计 专科</h4>
            <p className="about__timeline-sub">东莞职业技术学院 · 2020.10 — 2023.6</p>
            <p className="about__timeline-desc">
              系统学习工业设计方法论，包括产品手绘表达、三维建模、材料与加工工艺、
              人机工程学及模型制作，奠定了扎实的设计基础。
            </p>
          </div>
        </div>
      </div>
    ),
  },
]

const EMOJI_POOL = ['✨', '🌟', '💪', '🔥', '⚡', '💡', '🎯', '🚀', '💫', '⭐', '🌈', '🎨', '💎', '🏆', '🌻']

function About() {
  const [imgError, setImgError] = useState(false)
  const [hoverDirs, setHoverDirs] = useState({})
  const [activePanel, setActivePanel] = useState(0)
  const [emojis, setEmojis] = useState([])
  const emojiIdRef = useRef(0)
  const containerRef = useRef(null)

  // ── 头像视差(保留自旧 About 动效;头像图在 scrollReveal 排除清单里,
  //    不与统一入场系统冲突)——仅 ≥769px 且未开启减弱动态效果时生效 ──
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.create({
        trigger: '.about__visual',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
        animation: gsap.fromTo(
          '.about__avatar-img',
          { y: -30, scale: 1.06 },
          { y: 30, scale: 1 }
        ),
      })
    })
    return () => mm.revert()
  }, [])

  // ── 滚动触发动效(统一系统):面板切换后重新初始化,
  //    新面板内容立即入场,已入场内容保持可见 ──
  useEffect(() => initReveal(containerRef.current), [activePanel])

  // ── Touch / drag swipe ──
  const trackRef = useRef(null)
  const dragStart = useRef(null)

  const handlePointerDown = useCallback((e) => {
    dragStart.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerUp = useCallback((e) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = Math.abs(e.clientY - dragStart.current.y)
    dragStart.current = null

    // Only treat as swipe if horizontal movement > vertical and > threshold
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0 && activePanel < PANELS.length - 1) {
        setActivePanel(prev => prev + 1)
      } else if (dx > 0 && activePanel > 0) {
        setActivePanel(prev => prev - 1)
      }
    }
  }, [activePanel])

  // ── Hi emoji burst ──
  // 2026-11-08 用户要求:炸开起点=鼠标/手指点击位置(粒子是 fixed 定位
  // 视口坐标,直接取 clientX/clientY),不再固定取 hi 元素中心;
  // 键盘合成的 click 无坐标(0,0),回退到 hi 元素中心
  const handleHiClick = useCallback((e) => {
    const hiEl = e.target.closest('.about__greeting-hi')
    if (!hiEl) return

    const rect = hiEl.getBoundingClientRect()
    const cx = e.clientX || rect.left + rect.width / 2
    const cy = e.clientY || rect.top + rect.height / 2

    const count = 12
    const newEmojis = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
      const distance = 50 + Math.random() * 90
      return {
        id: ++emojiIdRef.current,
        emoji: EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)],
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        startX: cx,
        startY: cy,
        rotation: (Math.random() - 0.5) * 60,
        delay: Math.random() * 0.12,
        duration: 0.5 + Math.random() * 0.5,
      }
    })

    setEmojis(prev => [...prev, ...newEmojis])
    setTimeout(() => {
      setEmojis(prev => prev.filter(e => !newEmojis.some(ne => ne.id === e.id)))
    }, 1200)
  }, [])

  // ── Stat hover direction ──
  const handleMouseEnter = useCallback((index, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const fromRight = x > rect.width / 2
    setHoverDirs(prev => ({ ...prev, [index]: fromRight ? 'right' : 'left' }))
  }, [])

  const handleMouseLeave = useCallback((index, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const exitRight = x > rect.width / 2
    setHoverDirs(prev => ({ ...prev, [index]: exitRight ? 'right' : 'left' }))
  }, [])

  return (
    <section id="about" className="about" ref={containerRef}>
      <div className="about__inner">
        <div className="about__header">
          <span className="about__section-label" data-reveal="left">About</span>
        </div>

        <div className="about__body">
          <div className="about__visual">
            <div className="about__avatar" data-reveal="scale">
              {!imgError ? (
                <img
                  src={OSS + '/images/avatar.png'}
                  alt="Portrait"
                  className="about__avatar-img"
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgError(true)}
                  srcSet={getSrcSet(OSS + '/images/avatar.png')}
                  sizes={SIZES.avatar}
                />
              ) : (
                <div className="about__avatar-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="about__content">
            <h2 className="about__name" data-reveal>唐梓铮</h2>

            {/* ── Sliding panels ── */}
            <div
              className="about__panel-wrap"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onClick={handleHiClick}
            >
              <div
                className="about__panel-track"
                ref={trackRef}
                style={{ transform: `translateX(-${activePanel * 100}%)` }}
              >
                {PANELS.map((panel, i) => (
                  <div
                    key={panel.id}
                    className="about__panel"
                    style={{
                      opacity: i === activePanel ? 1 : 0,
                      transform: i === activePanel ? 'translateY(0)' : 'translateY(8px)',
                    }}
                    data-reveal-group={i === activePanel ? 'up' : undefined}
                  >
                    <p className="about__role">{panel.subtitle}</p>
                    {panel.content}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Navigation ── */}
            <div className="about__panel-nav" data-reveal>
              <button
                className={`about__panel-arrow${activePanel === 0 ? ' about__panel-arrow--disabled' : ''}`}
                onClick={() => setActivePanel(prev => Math.max(0, prev - 1))}
                aria-label="上一个"
                disabled={activePanel === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="about__panel-dots">
                {PANELS.map((panel, i) => (
                  <button
                    key={panel.id}
                    className={`about__panel-dot${i === activePanel ? ' about__panel-dot--active' : ''}`}
                    onClick={() => setActivePanel(i)}
                    aria-label={panel.label}
                  />
                ))}
              </div>

              <button
                className={`about__panel-arrow${activePanel === PANELS.length - 1 ? ' about__panel-arrow--disabled' : ''}`}
                onClick={() => setActivePanel(prev => Math.min(PANELS.length - 1, prev + 1))}
                aria-label="下一个"
                disabled={activePanel === PANELS.length - 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="about__stats" data-reveal-group>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`about__stat${hoverDirs[i] === 'right' ? ' about__stat--from-right' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(i, e)}
              onMouseLeave={(e) => handleMouseLeave(i, e)}
            >
              <span
                className="about__stat-number"
                data-reveal-count={s.count}
                data-reveal-count-suffix={s.suffix}
              >{s.number}</span>
              <span className="about__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emoji burst particles ── */}
      {emojis.map((e) => (
        <span
          key={e.id}
          className="about__emoji-particle"
          style={{
            '--start-x': `${e.startX}px`,
            '--start-y': `${e.startY}px`,
            '--end-x': `${e.x}px`,
            '--end-y': `${e.y}px`,
            '--rotation': `${e.rotation}deg`,
            '--delay': `${e.delay}s`,
            '--duration': `${e.duration}s`,
          }}
        >
          {e.emoji}
        </span>
      ))}
    </section>
  )
}

export default About
