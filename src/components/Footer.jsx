import './Footer.css'

function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footer__inner">
        <div className="footer__main">
          <h2 className="footer__heading">
            Let&rsquo;s create
            <br />
            something meaningful.
          </h2>
          <p className="footer__text">
            如果你有一个想法，或者只是想聊聊设计，欢迎联系我。
          </p>
          <div className="footer__contact">
            <a href="mailto:hello@chenwei.design" className="footer__email">
              hello@chenwei.design
              <span className="footer__arrow">→</span>
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__social">
            <a href="#" target="_blank" rel="noopener noreferrer">Behance</a>
            <span className="footer__sep">/</span>
            <a href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span className="footer__sep">/</span>
            <a href="#" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
          <span className="footer__copyright">
            © 2025 Chen Wei. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
