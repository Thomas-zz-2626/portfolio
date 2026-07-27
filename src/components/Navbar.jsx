import './Navbar.css'

function Navbar({ scrolled }) {
  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a href="#hero" className="navbar__logo">CHEN WEI</a>
        <ul className="navbar__links">
          <li><a href="#projects">工作</a></li>
          <li><a href="#about">关于</a></li>
          <li><a href="#contact">接触</a></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
