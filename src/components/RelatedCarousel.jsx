// ── Related-works coverflow carousel ──
// 3D rake of project cards: the centre card faces the reader, neighbours
// recede with tilt + depth, drag / arrows / keyboard rotate the ring.
//
// Motion-spec compliance (CLAUDE.md 动效响应式规范 v1):
//  · transform / opacity only — RAF paints inline styles, no layout thrash
//  · pointer events (pointerdown/move/up + setPointerCapture) — touch OK,
//    touch-action: pan-y keeps vertical page scrolling on touch devices
//  · tuning (rotate / depth / perspective / falloff / fade / card width)
//    comes from CSS custom properties per breakpoint, read once per resize
//  · prefers-reduced-motion: cards lay flat (no tilt / recession) and the
//    settle jumps instantly — no animation, no infinite motion
//  · will-change is attached only while dragging / settling (--moving class)
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getSrcSet, SIZES } from '../imageSrc'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Parse a numeric custom property ('44deg' → 44). */
const numVar = (cs, name, fallback) => {
  const v = parseFloat(cs.getPropertyValue(name))
  return Number.isFinite(v) ? v : fallback
}

function RelatedCarousel({ projects, initialIndex = 0, onSelect, label = '浏览其他作品轮播' }) {
  const count = projects.length
  /** With 2 cards the ring fold has no room — run a clamped strip instead. */
  const loop = count > 2

  const rootRef = useRef(null)
  const frameRef = useRef(null)
  const cardRefs = useRef([])
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = useRef(initialIndex)
  /** Where the current settle is headed — stepping off pos would swallow a
      keypress that lands mid-flight, before the round-off moves. */
  const targetRef = useRef(initialIndex)
  const widthRef = useRef(0)
  const rafRef = useRef(null)
  const dragRef = useRef(null)
  const tuningRef = useRef({ rotate: 44, depth: 0.6, perspective: 3, falloff: 0.56, fade: 0.1, gap: 0.05 })
  const reducedRef = useRef(false)

  const [selected, setSelected] = useState(initialIndex)
  const [moving, setMoving] = useState(false)

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = useCallback(
    (pos) => ((Math.round(pos) % count) + count) % count,
    [count],
  )

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = useCallback(() => {
    const width = widthRef.current
    if (!width) return
    const { rotate, depth, falloff, fade, gap } = tuningRef.current
    const reduced = reducedRef.current
    const pitch = width * (1 + gap)
    const pos = posRef.current

    cardRefs.current.forEach((card, index) => {
      if (!card) return

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos
      if (loop) {
        offset = ((offset % count) + count) % count
        if (offset > count / 2) offset -= count
      }

      const distance = Math.abs(offset)
      // A card is teleported across the ring at exactly half a turn out, so
      // it has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge)
      card.style.zIndex = String(100 - Math.round(distance))

      if (reduced) {
        // Flat, readable rack — lateral offset only, no tilt or recession.
        card.style.transform = `translateX(calc(-50% + ${offset * pitch}px))`
        return
      }

      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff)
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset)

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`
    })
  }, [count, loop])

  const settle = useCallback(
    (target) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      targetRef.current = target
      setSelected(indexAt(target))

      if (reducedRef.current) {
        posRef.current = target
        paint()
        rafRef.current = null
        setMoving(false)
        return
      }

      setMoving(true)
      const step = () => {
        const remaining = target - posRef.current
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target
          paint()
          rafRef.current = null
          setMoving(false)
          return
        }
        // Exponential ease-out, not a spring. Swap in a spring only if the
        // settle needs overshoot.
        posRef.current += remaining * 0.16
        paint()
        rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    },
    [indexAt, paint],
  )

  const clamp = useCallback(
    (pos) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  )

  const goTo = useCallback(
    (index) => {
      // Take the shorter way round rather than unwinding the whole ring.
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index
      settle(clamp(target))
    },
    [clamp, count, loop, settle],
  )

  const nudge = useCallback(
    (by) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  )

  const onPointerDown = (event) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    targetRef.current = posRef.current
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      // 未位移的按下=点击(tap)。捕获会把 click 重定向到 frame、卡片
      // 自身收不到 click,所以点击语义在 pointerup 里自己判(2026-11-07 修复)
      moved: false,
    }
    setMoving(true)
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return

    const pitch = widthRef.current * (1 + tuningRef.current.gap)
    if (!pitch) return

    if (Math.abs(event.clientX - drag.x) > 6) drag.moved = true

    const now = performance.now()
    const previous = posRef.current
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch)
    // Cards per second, for the throw.
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000
    drag.t = now

    const index = indexAt(posRef.current)
    if (index !== selected) setSelected(index)
    paint()
  }

  const endDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    dragRef.current = null

    // Tap(按下到松开位移 < 6px,且非 pointercancel):按松开位置命中卡片——
    // 命中中心卡 → 打开该项目;命中侧卡 → 旋转到中心(再点即打开)
    if (!drag.moved && event.type !== 'pointercancel') {
      const el = document.elementFromPoint(event.clientX, event.clientY)
      const cardEl = el?.closest('.lightbox__related-card')
      const idx = cardEl ? Number(cardEl.dataset.index) : NaN
      if (Number.isInteger(idx) && idx >= 0 && idx < count) {
        setMoving(false)
        if (idx === selected) onSelect?.(projects[idx])
        else goTo(idx)
        return
      }
    }

    // Let a flick carry, but never more than two cards.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18))
    settle(clamp(Math.round(posRef.current + carried)))
  }

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    const frame = frameRef.current
    if (!root || !frame) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const measure = () => {
      const cs = getComputedStyle(root)
      reducedRef.current = mq.matches
      tuningRef.current = {
        rotate: numVar(cs, '--rc-rotate', 44),
        depth: numVar(cs, '--rc-depth', 0.6),
        perspective: numVar(cs, '--rc-perspective', 3),
        falloff: numVar(cs, '--rc-falloff', 0.56),
        fade: numVar(cs, '--rc-fade', 0.1),
        gap: numVar(cs, '--rc-gap', 0.05),
      }
      const card = cardRefs.current[0]
      if (card) widthRef.current = card.offsetWidth
      paint()
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    mq.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      mq.removeEventListener('change', measure)
    }
  }, [paint])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  return (
    <div
      ref={rootRef}
      className={`lightbox__related-coverflow${moving ? ' lightbox__related-coverflow--moving' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        ref={frameRef}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            nudge(-1)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            nudge(1)
          }
        }}
        className="lightbox__related-frame"
        style={{ perspective: 'calc(var(--rc-card) * var(--rc-perspective))' }}
      >
        <div className="lightbox__related-stage">
          {projects.map((item, index) => (
            <div
              key={item.id}
              ref={(node) => {
                cardRefs.current[index] = node
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${count}`}
              aria-current={index === selected ? 'true' : undefined}
              className={`lightbox__related-card${index === selected ? ' lightbox__related-card--active' : ''}`}
              data-index={index}
            >
              <div className="lightbox__related-card-img">
                {item.image ? (
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" draggable={false} srcSet={getSrcSet(item.image)} sizes={SIZES.related} />
                ) : (
                  <div className="lightbox__placeholder-img lightbox__placeholder-img--related" />
                )}
              </div>
              <div className="lightbox__related-card-info">
                <h3 className="lightbox__related-card-title">{item.title}</h3>
                <p className="lightbox__related-card-year">{item.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {count > 2 && (
        <>
          <button
            type="button"
            className="lightbox__related-arrow lightbox__related-arrow--left"
            onClick={() => nudge(-1)}
            aria-label="上一个"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 6 9 12 15 18" />
            </svg>
          </button>
          <button
            type="button"
            className="lightbox__related-arrow lightbox__related-arrow--right"
            onClick={() => nudge(1)}
            aria-label="下一个"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

export default RelatedCarousel
