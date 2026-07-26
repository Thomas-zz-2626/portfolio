import './Hero.css'

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__inner">
        <div className="hero__kicker">
          <span className="hero__line" />
          <span className="hero__label">Industrial Designer</span>
        </div>
        <h1 className="hero__title">
          Design that
          <br />
          speaks for itself.
        </h1>
        <p className="hero__subtitle">
          以克制的设计语言，塑造有温度的产品体验
        </p>
        <div className="hero__scroll">
          <span className="hero__scroll-text">Scroll</span>
          <span className="hero__scroll-bar" />
        </div>
      </div>
    </section>
  )
}

export default Hero
