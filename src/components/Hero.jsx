import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { useGsapContext } from '../hooks/useGsapContext'
import { createHeroEntrance } from '../animations'
import './Hero.css'

function Hero() {
  const containerRef = useGsapContext(createHeroEntrance, [])
  const titleRef = useRef(null)
  const wordRefs = useRef([])
  const quickToX = useRef([])
  const quickToY = useRef([])
  const lastClosest = useRef(-1)

  // Init quickTo after mount
  useEffect(() => {
    quickToX.current = wordRefs.current.map((el, i) =>
      el ? gsap.quickTo(wordRefs.current[i], 'x', { duration: 0.75, ease: 'power3.out' }) : null
    )
    quickToY.current = wordRefs.current.map((el, i) =>
      el ? gsap.quickTo(wordRefs.current[i], 'y', { duration: 0.75, ease: 'power3.out' }) : null
    )
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!titleRef.current) return
    const rect = titleRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5 // -0.5 … 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5

    // Find word closest to cursor
    let closestIdx = 0
    let minDist = Infinity
    wordRefs.current.forEach((el, i) => {
      if (!el) return
      const wRect = el.getBoundingClientRect()
      const wCenterX = wRect.left + wRect.width / 2
      const dist = Math.abs(e.clientX - wCenterX)
      if (dist < minDist) { minDist = dist; closestIdx = i }
    })

    // Toggle logic fill on/off
    if (lastClosest.current !== closestIdx) {
      if (lastClosest.current === 2) {
        wordRefs.current[2]?.classList.remove('hero__title-word--fill')
      }
      lastClosest.current = closestIdx
      if (closestIdx === 2) {
        wordRefs.current[2]?.classList.add('hero__title-word--fill')
      }
    }

    // Move each word — closest moves most, further move less
    wordRefs.current.forEach((_, i) => {
      const distance = Math.abs(i - closestIdx)
      const factor = distance === 0 ? 1 : distance === 1 ? 0.35 : 0.12
      quickToX.current[i]?.(relX * 38 * factor)
      quickToY.current[i]?.(relY * 20 * factor)
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    wordRefs.current.forEach((_, i) => {
      quickToX.current[i]?.(0)
      quickToY.current[i]?.(0)
    })
    if (lastClosest.current === 2) {
      wordRefs.current[2]?.classList.remove('hero__title-word--fill')
    }
    lastClosest.current = -1
  }, [])

  return (
    <section id="hero" className="hero" ref={containerRef}>
      <div className="hero__inner">
        <div className="hero__kicker">
          <span className="hero__line" />
          <span className="hero__label">Industrial Designer</span>
        </div>
        <h1
          className="hero__title"
          ref={titleRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <span className="hero__title-text">
            <span
              className="hero__title-word hero__title-word--sm"
              ref={(el) => (wordRefs.current[0] = el)}
            >
              Form
            </span>
            {' '}
            <span
              className="hero__title-word hero__title-word--sm"
              ref={(el) => (wordRefs.current[1] = el)}
            >
              follows
            </span>
            {' '}
            <span
              className="hero__title-word hero__title-word--lg hero__title-word--outline"
              ref={(el) => (wordRefs.current[2] = el)}
            >
              logic.
            </span>
          </span>
        </h1>
        <p className="hero__subtitle">形态，遵从逻辑</p>
      </div>
      <div className="hero__scroll">
        <span className="hero__scroll-text">Scroll</span>
        <span className="hero__scroll-bar" />
      </div>
    </section>
  )
}

export default Hero
