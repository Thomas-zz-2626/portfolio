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

  // 2026-11-15:github.io 的图片请求会无限期挂起(半死连接,无报错无超时);
  // sw.js 对 /images/* 加了 12s 熔断,超时回 504 触发 error 事件——此处全局
  // 捕获,剥掉旧穿透参数后带新参数重试(至多 5 次 ≈ 60s 窗口,等连接恢复),
  // 期间 LQIP 底图保持显示。重试参数强制新 URL,不走 HTTP 缓存。
  useEffect(() => {
    const onImgError = (e) => {
      const im = e.target
      if (!(im instanceof HTMLImageElement)) return
      const tries = parseInt(im.dataset.imgRetry || '0', 10)
      if (tries >= 5) return
      im.dataset.imgRetry = String(tries + 1)
      const b = '?r=' + Math.random().toString(36).slice(2)
      const bust = (u) => u.split('?')[0] + b
      if (im.srcset) {
        im.srcset = im.srcset.split(',').map((s) => {
          const parts = s.trim().split(' ')
          return bust(parts[0]) + ' ' + parts.slice(1).join(' ')
        }).join(', ')
      } else {
        im.src = bust(im.src)
      }
    }
    document.addEventListener('error', onImgError, true)
    return () => document.removeEventListener('error', onImgError, true)
  }, [])

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
    </>
  )
}

export default App
