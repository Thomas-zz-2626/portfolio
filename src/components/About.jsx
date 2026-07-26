import { useState } from 'react'
import './About.css'

const STATS = [
  { number: '8+', label: 'Years Experience' },
  { number: '60+', label: 'Projects Completed' },
  { number: '15+', label: 'Awards Won' },
  { number: '30+', label: 'Global Clients' },
]

const CONTACTS = [
  { label: 'Email', value: 'hello@chenwei.design' },
  { label: 'Location', value: 'Shanghai, China' },
  { label: 'WeChat', value: 'chenwei_design' },
]

function About() {
  const [imgError, setImgError] = useState(false)

  return (
    <section id="about" className="about">
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
            <h2 className="about__name">Chen Wei</h2>
            <p className="about__role">Industrial Designer & Design Strategist</p>
            <p className="about__bio">
              专注于产品设计与品牌体验，善于在功能与美学之间寻找平衡点。
              从消费电子到家居用品，从概念探索到量产落地，
              始终坚持以用户为中心的设计方法，为每一个项目注入独特的思考与温度。
              相信好的设计不需要解释——它自然地融入生活，让一切变得更简单、更美好。
            </p>

            <div className="about__contacts">
              {CONTACTS.map((c) => (
                <div key={c.label} className="about__contact-item">
                  <span className="about__contact-label">{c.label}</span>
                  <span className="about__contact-value">{c.value}</span>
                </div>
              ))}
            </div>
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
