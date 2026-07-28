import { useState } from 'react'
import { useGsapContext } from '../hooks/useGsapContext'
import { createAboutReveal } from '../animations'
import './About.css'

const STATS = [
  { number: '2', label: 'Years Experience' },
  { number: '30+', label: 'Projects Completed' },
  { number: '1w+', label: 'Sales Volume' },
  { number: '500w+', label: 'Sales Revenue' },
]

function About() {
  const [imgError, setImgError] = useState(false)
  const containerRef = useGsapContext(createAboutReveal, [])

  return (
    <section id="about" className="about" ref={containerRef}>
      <div className="about__inner">
        <div className="about__header">
          <span className="about__section-label">About</span>
        </div>

        <div className="about__body">
          <div className="about__visual">
            <div className="about__avatar">
              {!imgError ? (
                <img
                  src="/images/avatar.png"
                  alt="Portrait"
                  className="about__avatar-img"
                  onError={() => setImgError(true)}
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
            <h2 className="about__name">唐梓铮</h2>
            <p className="about__role">Industrial Designer</p>
            <p className="about__bio">
              专注于产品设计与品牌体验，善于在功能与美学之间寻找平衡点。
              从消费电子到家居用品，从概念探索到量产落地，
              始终坚持以用户为中心的设计方法，为每一个项目注入独特的思考与温度。
              相信好的设计不需要解释——它自然地融入生活，让一切变得更简单、更美好。
            </p>

          </div>
        </div>

        <div className="about__stats">
          {STATS.map((s) => (
            <div key={s.label} className="about__stat">
              <span className="about__stat-number">{s.number}</span>
              <span className="about__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About
