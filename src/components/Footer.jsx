import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { useGsapContext } from '../hooks/useGsapContext'
import { createFooterReveal } from '../animations'
import './Footer.css'

function Footer() {
  const containerRef = useGsapContext(createFooterReveal, [])
  const headingRef = useRef(null)
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
    if (!headingRef.current) return
    const rect = headingRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
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

    // Toggle "meaningful." fill on/off (index 3)
    if (lastClosest.current !== closestIdx) {
      if (lastClosest.current === 3) {
        wordRefs.current[3]?.classList.remove('footer__heading-word--fill')
      }
      lastClosest.current = closestIdx
      if (closestIdx === 3) {
        wordRefs.current[3]?.classList.add('footer__heading-word--fill')
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
    if (lastClosest.current === 3) {
      wordRefs.current[3]?.classList.remove('footer__heading-word--fill')
    }
    lastClosest.current = -1
  }, [])

  return (
    <footer id="contact" className="footer" ref={containerRef}>
      <div className="footer__inner">
        <div className="footer__main">
          <h2
            className="footer__heading"
            ref={headingRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <span className="footer__heading-text">
              <span
                className="footer__heading-word footer__heading-word--sm"
                ref={(el) => (wordRefs.current[0] = el)}
              >
                Let&rsquo;s
              </span>
              {' '}
              <span
                className="footer__heading-word footer__heading-word--sm"
                ref={(el) => (wordRefs.current[1] = el)}
              >
                create
              </span>
              {' '}
              <span
                className="footer__heading-word footer__heading-word--sm"
                ref={(el) => (wordRefs.current[2] = el)}
              >
                something
              </span>
              {' '}
              <span
                className="footer__heading-word footer__heading-word--lg footer__heading-word--outline"
                ref={(el) => (wordRefs.current[3] = el)}
              >
                meaningful.
              </span>
            </span>
          </h2>
          <p className="footer__text">
            如果你有一个想法，或者只是想聊聊设计，欢迎联系我。
          </p>
          <div className="footer__contact">
            <div className="footer__contact-lines">
              <p className="footer__contact-item">电话：15362924544</p>
              <p className="footer__contact-item">微信：npc_2626</p>
              <p className="footer__contact-item">邮箱：1216811949@qq.com</p>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">
            © 2026 Thomas. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
