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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Navbar drop-in entrance
  useEffect(() => {
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
