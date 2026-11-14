import { useState, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Footer from './components/Footer'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [scrolled, setScrolled] = useState(false)

  // ── 全局移动端拦截弹窗(2026-11-14 用户要求:全站 <1024px 只显示提示弹窗,
  //    ≥1024px 正常显示;resize 实时监听,叉号可关(仅当次,拉大后重置)──
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1024)
  const [gateDismissed, setGateDismissed] = useState(false)

  useEffect(() => {
    const onResize = () => {
      const narrow = window.innerWidth < 1024
      setIsNarrow(narrow)
      if (!narrow) setGateDismissed(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const gated = isNarrow && !gateDismissed

  // 弹窗显示时隐藏除弹窗外的全部页面内容
  useEffect(() => {
    document.getElementById('root')?.classList.toggle('gated', gated)
  }, [gated])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Navbar drop-in entrance（用户开启「减弱动态效果」时跳过）
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.navbar',
        { yPercent: -100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      <Navbar scrolled={scrolled} />
      <Hero />
      <About />
      <Projects />
      <Footer />

      {/* ── 全局移动端拦截弹窗:<1024px 整站只显示此提示 ── */}
      {gated && (
        <div className="site-gate" role="dialog" aria-modal="true" aria-labelledby="site-gate-title">
          <button type="button" className="site-gate__close" aria-label="关闭提示" onClick={() => setGateDismissed(true)}>
            ✕
          </button>
          <div className="site-gate__text">
            <h2 id="site-gate-title">请在电脑端浏览</h2>
            <p>本页面为横版展示内容，移动端暂不支持查看，请切换至电脑打开获得完整浏览效果</p>
          </div>
        </div>
      )}
    </>
  )
}

export default App
