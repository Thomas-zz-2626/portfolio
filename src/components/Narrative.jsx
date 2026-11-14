import { useEffect, useRef } from 'react'
import './Narrative.css'
import { getSrcSet, SIZES } from '../imageSrc'

// ── Long-page scroll narrative ──
// A thin grey thread runs from the top label down through the staggered
// cards to the bottom label. It draws itself (stroke-dash) as the section
// crosses the viewport, and each node dot lights up as the line tip passes.
// Card entrances use IntersectionObserver; the line follows scroll progress
// through a damped rAF loop so it never jumps with the wheel.
function Narrative({ narrative }) {
  const rootRef = useRef(null)
  const svgRef = useRef(null)
  const pathRef = useRef(null)

  const { top, steps, bottom } = narrative

  useEffect(() => {
    const root = rootRef.current
    const svg = svgRef.current
    const path = pathRef.current
    if (!root || !svg || !path) return

    const scrollEl = root.closest('.lightbox__scroll')
    if (!scrollEl) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Card entrances — IO per card, 100ms stagger between neighbours ──
    const cards = [...root.querySelectorAll('.narrative__card-inner')]
    let io
    if (reduceMotion) {
      cards.forEach((c) => c.classList.add('is-in'))
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in')
              io.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.35 }
      )
      cards.forEach((c) => io.observe(c))
    }

    if (reduceMotion) return () => io && io.disconnect()

    // ── The thread ──
    let length = 0
    let current = null
    let target = 0
    let raf = null

    const dots = () => [...root.querySelectorAll('.narrative__node')]

    // Smooth S-curve through the node anchors, control points pulled to the
    // vertical midpoints so the line stays upright and gentle.
    const buildPath = (pts) => {
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const dy = b.y - a.y
        d += ` C ${a.x.toFixed(1)} ${a.y + dy * 0.45}, ${b.x.toFixed(1)} ${b.y - dy * 0.45}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
      }
      return d
    }

    // Anchor dots are layout-stable: the entrance animation moves the card
    // *content* via transform, which never affects layout, so the path only
    // needs rebuilding when the section itself is resized.
    const measureGeometry = () => {
      const rect = root.getBoundingClientRect()
      const W = Math.max(rect.width, 1)
      const H = Math.max(rect.height, 1)
      svg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`)
      const dotEls = dots()
      const pts = dotEls.map((dot) => {
        const r = dot.getBoundingClientRect()
        return {
          x: r.left - rect.left + r.width / 2,
          y: r.top - rect.top + r.height / 2,
          share: (r.top - rect.top + r.height / 2) / H,
        }
      })
      if (pts.length < 2) return
      path.setAttribute('d', buildPath(pts))
      length = path.getTotalLength()
      path.style.strokeDasharray = `${length.toFixed(1)}`
      path.style.strokeDashoffset = `${length.toFixed(1)}`
      dotEls.forEach((dot, i) => {
        dot.dataset.share = pts[i].share
      })
    }

    // The line draws top→bottom as the section travels through the viewport.
    const computeProgress = () => {
      const rect = root.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(Math.max((vh - rect.top) / (rect.height + vh), 0), 1)
      target = length * (1 - p)
    }

    const paint = (offset) => {
      path.style.strokeDashoffset = `${offset.toFixed(1)}`
      const drawn = 1 - offset / length
      dots().forEach((dot) => {
        dot.classList.toggle('is-lit', drawn >= parseFloat(dot.dataset.share) - 0.02)
      })
    }

    const tick = () => {
      current += (target - current) * 0.12 // damped follow — the "缓动"
      if (Math.abs(target - current) < 0.5) {
        current = target
        paint(current)
        raf = null
        return
      }
      paint(current)
      raf = requestAnimationFrame(tick)
    }

    const handleScroll = () => {
      computeProgress()
      if (raf === null) raf = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(() => {
      measureGeometry()
      computeProgress()
      current = target
      paint(current)
    })
    ro.observe(root)

    measureGeometry()
    computeProgress()
    current = target
    paint(current)
    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      if (io) io.disconnect()
      ro.disconnect()
      scrollEl.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [narrative])

  return (
    <section className="narrative" ref={rootRef}>
      <svg className="narrative__line" ref={svgRef} aria-hidden="true">
        <path ref={pathRef} d="" fill="none" stroke="#d9d9d7" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <header className="narrative__top">
        <div className="narrative__top-inner">
          <p className="narrative__label">{top.label}</p>
          {top.text && <p className="narrative__label-text">{top.text}</p>}
          <span className="narrative__node narrative__node--label" aria-hidden="true" />
        </div>
      </header>

      <div className="narrative__flow">
        {steps.map((step, i) => (
          <div className={`narrative__row narrative__row--${step.align}`} key={i}>
            <article className={`narrative__card${step.align === 'center' ? ' narrative__card--center' : ''}`}>
              <span className="narrative__node narrative__node--card" aria-hidden="true" />
              <div className="narrative__card-inner" style={{ transitionDelay: `${i * 100}ms` }}>
                {/* 无配图不渲染占位灰盒(2026-10-22 删除卡片内空白内容) */}
                {step.image && (
                  <div className="narrative__card-media">
                    <img src={step.image} alt={step.title} loading="lazy" decoding="async" srcSet={getSrcSet(step.image)} sizes={SIZES.half} />
                  </div>
                )}
                <h3 className="narrative__card-title">{step.title}</h3>
                <p className="narrative__card-text">{step.text}</p>
              </div>
            </article>
          </div>
        ))}
      </div>

      <footer className="narrative__bottom">
        <div className="narrative__bottom-inner">
          <span className="narrative__node narrative__node--label" aria-hidden="true" />
          <p className="narrative__label">{bottom.label}</p>
          {bottom.text && <p className="narrative__label-text">{bottom.text}</p>}
        </div>
      </footer>
    </section>
  )
}

export default Narrative
