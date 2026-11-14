// ── AccordionGallery(React Bits 移植,2026-10-27 用户指定)──
// 图片手风琴画廊:横排面板,hover/点按/焦点展开,GSAP flex-grow 过渡。
// 与 React Bits 原版的差异(项目规范适配):
//   1. 交互改 pointer 事件(规范 v1:统一 pointer,触屏 tap 即展开);
//   2. 每格新增 caption(说明文字,随标签一同展开/收起,承载 PEST 详情);
//   3. 面板高度走 CSS 变量 --ag-height,媒体查询分档(规范 v1 四档);
//   4. 去 will-change(动画结束不留合成层);
//   5. 项目图片管线:img 走 srcSet/LQIP/lazy(由调用方随 items 传入);
//   6. ref 回调用花括号体(React 19 不允许返回值)。
// prefers-reduced-motion:dur=0 即时切换(原版逻辑保留)。
import { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'

import './AccordionGallery.css'

const DEFAULT_ITEMS = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline' },
]

const AccordionGallery = ({
  items = DEFAULT_ITEMS,
  defaultIndex = 2,
  accentColor = '#ffffff',
  overlayColor = '#060010',
  textColor = '#ffffff',
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  duration = 0.6,
  ease = 'power3.out',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  className = '',
}) => {
  const rootRef = useRef(null)
  const panelRefs = useRef([])
  const mediaRefs = useRef([])
  const barRefs = useRef([])
  const textRefs = useRef([])
  const captionRefs = useRef([])
  const tlRef = useRef(null)
  const firstRunRef = useRef(true)
  const mediaSizeRef = useRef(320)

  const count = items.length
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1))

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const applyLayout = useCallback(
    (animate) => {
      const panels = panelRefs.current
      if (!panels.length) return

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9)
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1
      const mediaSize = mediaSizeRef.current

      tlRef.current?.kill()
      const dur = animate && !prefersReduced ? duration : 0
      const tl = gsap.timeline()

      panels.forEach((panel, i) => {
        if (!panel) return
        const isActive = i === active
        const media = mediaRefs.current[i]
        const bar = barRefs.current[i]
        const text = textRefs.current[i]
        const caption = captionRefs.current[i]

        const rot = isActive ? 0 : i < active ? tilt : -tilt
        tl.to(panel, { flexGrow: isActive ? grow : 1, rotateY: rot, duration: dur, ease }, 0)

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i))
          const shift = drift * parallax * mediaSize * 0.06
          const gray = grayscale ? (isActive ? 0 : 1) : 0
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: isActive ? 0 : shift,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.35,
              duration: dur,
              ease,
            },
            0
          )
        }

        if (showLabels && bar && text) {
          const els = caption ? [bar, text, caption] : [bar, text]
          if (isActive) {
            tl.to(els, { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger }, 0)
          } else {
            tl.to(els, { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0)
          }
        }
      })

      tlRef.current = tl
    },
    [active, count, expandRatio, duration, ease, tilt, parallax, grayscale, showLabels, stagger, prefersReduced]
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      const total = rect.width
      const usable = Math.max(total - gap * (count - 1), 120)
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22)
      mediaSizeRef.current = size
      el.style.setProperty('--ag-media-size', `${size}px`)
      applyLayout(!firstRunRef.current)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [applyLayout, gap, count, expandRatio])

  useEffect(() => {
    applyLayout(!firstRunRef.current)
    firstRunRef.current = false
  }, [applyLayout])

  useEffect(
    () => () => {
      tlRef.current?.kill()
    },
    []
  )

  const handleEnter = (i) => {
    if (trigger === 'hover') setActive(i)
  }

  const handleClick = (i, e) => {
    if (i !== active) {
      e.preventDefault()
      setActive(i)
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i + 1) % count)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i - 1 + count) % count)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`accordion-gallery${className ? ` ${className}` : ''}`}
      style={{
        '--ag-accent': accentColor,
        '--ag-overlay': overlayColor,
        '--ag-text': textColor,
        '--ag-gap': `${gap}px`,
        '--ag-radius': `${radius}px`,
        height: 'var(--ag-height, 460px)',
      }}
      role="list"
      aria-label="宏观背景分析图库"
    >
      {items.map((item, i) => {
        const isActive = i === active
        const Tag = item.link ? 'a' : 'div'
        return (
          <Tag
            key={i}
            ref={(el) => { panelRefs.current[i] = el }}
            className={`ag-panel${isActive ? ' ag-panel--active' : ''}`}
            style={{ borderRadius: `${radius}px` }}
            href={item.link || undefined}
            onClick={(e) => handleClick(i, e)}
            onPointerEnter={() => handleEnter(i)}
            onFocus={() => setActive(i)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            role="listitem"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label}
          >
            <span className="ag-panel__frame">
              <span
                className="ag-panel__media"
                ref={(el) => { mediaRefs.current[i] = el }}
              >
                <img
                  src={item.image}
                  srcSet={item.srcSet}
                  sizes={item.sizes}
                  alt={item.alt || item.label || ''}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  style={item.lqip ? { backgroundImage: `url(${item.lqip})`, backgroundSize: 'cover' } : undefined}
                />
              </span>
              <span className="ag-panel__overlay" aria-hidden="true" />
            </span>
            {showLabels && (
              <span className="ag-panel__label" aria-hidden="true">
                <span className="ag-panel__row">
                  <span className="ag-panel__bar" ref={(el) => { barRefs.current[i] = el }} />
                  <span className="ag-panel__text" ref={(el) => { textRefs.current[i] = el }}>
                    {item.label}
                  </span>
                </span>
                {item.caption && (
                  <span className="ag-panel__caption" ref={(el) => { captionRefs.current[i] = el }}>
                    {item.caption}
                  </span>
                )}
              </span>
            )}
          </Tag>
        )
      })}
    </div>
  )
}

export default AccordionGallery
