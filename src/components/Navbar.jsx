import './Navbar.css'

function Navbar({ scrolled }) {
  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a href="#hero" className="navbar__logo">
          PORTFOL<span className="navbar__logo-dot">i</span>O
        </a>
        <ul className="navbar__links">
          <li><a href="#about">介绍</a></li>
          <li><a href="#projects">作品</a></li>
          <li><a href="#contact">联系</a></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
