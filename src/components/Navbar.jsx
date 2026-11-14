import { useState } from 'react'
import './Navbar.css'

function Navbar({ scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}${menuOpen ? ' navbar--open' : ''}`}>
      {/* 2026-10-28 用户定版:简单磨砂玻璃导航 = backdrop-blur-md(12px)+ bg-white/10,
          全部文字/按钮/交互保持原样 */}
      <div className="navbar__inner">
        <a href="#hero" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          PORTFOL<span className="navbar__logo-dot">i</span>O
        </a>
        <button
          type="button"
          className="navbar__burger"
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul id="navbar-menu" className={`navbar__links${menuOpen ? ' is-open' : ''}`}>
          <li><a href="#about" onClick={() => setMenuOpen(false)}>介绍</a></li>
          <li><a href="#projects" onClick={() => setMenuOpen(false)}>作品</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>联系</a></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
