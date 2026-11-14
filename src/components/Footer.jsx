import { useRef, useEffect, useCallback, useState } from 'react'
import gsap from 'gsap'
import { initReveal } from '../scrollReveal'
import './Footer.css'

const CONTACT_ITEMS = [
  { label: '电话', value: '15362924544' },
  { label: '微信', value: 'npc_2626' },
  { label: '邮箱', value: '1216811949@qq.com' },
]

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      className={`footer__copy-btn${copied ? ' footer__copy-btn--copied' : ''}`}
      onClick={handleCopy}
      aria-label={`复制${value}`}
      title="复制"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

function Footer() {
  const containerRef = useRef(null)
  const headingRef = useRef(null)
  const wordRefs = useRef([])
  const quickToX = useRef([])
  const quickToY = useRef([])
  const lastClosest = useRef(-1)

  // ── 滚动触发动效(统一系统)──
  useEffect(() => initReveal(containerRef.current), [])

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
            <span className="footer__heading-text" data-reveal>
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
          <p className="footer__text" data-reveal>
            如果你有一个想法，或者只是想聊聊设计，欢迎联系我。
          </p>
          <div className="footer__contact">
            <div className="footer__contact-lines" data-reveal-group>
              {CONTACT_ITEMS.map((item) => (
                <p className="footer__contact-item" key={item.label}>
                  {item.label}：{item.value}
                  <CopyButton value={item.value} />
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="footer__bottom" data-reveal>
          <span className="footer__copyright">
            © 2026 Thomas. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
