import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ──────────────── About Section ──────────────── */

export function createAboutReveal(container) {
  const mm = gsap.matchMedia()

  // Desktop / Tablet
  mm.add('(min-width: 769px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 72%',
        toggleActions: 'play none none none',
      },
    })

    // Section label slides in from left
    tl.fromTo(
      '.about__section-label',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
      0
    )

    // Avatar: clip-path wipe from bottom + subtle scale settle
    tl.fromTo(
      '.about__avatar',
      { clipPath: 'inset(0 0 100% 0)', scale: 1.04, opacity: 0 },
      { clipPath: 'inset(0 0 0% 0)', scale: 1, opacity: 1, duration: 1.0, ease: 'power4.inOut' },
      0.15
    )

    // Name
    tl.fromTo(
      '.about__name',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' },
      0.3
    )

    // Role
    tl.fromTo(
      '.about__role',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power4.out' },
      0.45
    )

    // Bio
    tl.fromTo(
      '.about__bio',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power4.out' },
      0.55
    )

    // Stats — staggered with counter
    tl.fromTo(
      '.about__stat',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power4.out' },
      0.85
    )

    // Stat number counters
    const statNumbers = [
      { el: '.about__stat:nth-child(1) .about__stat-number', target: 2, suffix: '' },
      { el: '.about__stat:nth-child(2) .about__stat-number', target: 30, suffix: '+' },
      { el: '.about__stat:nth-child(3) .about__stat-number', target: 1, suffix: 'w+' },
      { el: '.about__stat:nth-child(4) .about__stat-number', target: 500, suffix: 'w+' },
    ]

    statNumbers.forEach(({ el, target, suffix }) => {
      const element = container.querySelector(el)
      if (!element) return
      const counter = { value: 0 }
      tl.to(
        counter,
        {
          value: target,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => {
            element.textContent = Math.round(counter.value) + suffix
          },
        },
        0.85
      )
    })

    // Avatar image parallax (scrub)
    ScrollTrigger.create({
      trigger: '.about__visual',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.6,
      animation: gsap.fromTo(
        '.about__avatar-img',
        { y: -30, scale: 1.06 },
        { y: 30, scale: 1 }
      ),
    })
  })

  // Mobile
  mm.add('(max-width: 768px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 78%',
        toggleActions: 'play none none none',
      },
    })

    tl.fromTo('.about__section-label', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0)
    tl.fromTo('.about__avatar', { clipPath: 'inset(0 0 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.7, ease: 'power4.inOut' }, 0.1)
    tl.fromTo('.about__name', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' }, 0.2)
    tl.fromTo('.about__role', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power4.out' }, 0.3)
    tl.fromTo('.about__bio', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' }, 0.38)
    tl.fromTo('.about__stat', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power4.out' }, 0.6)

    // Stat number counters (mobile)
    const statNumbersMobile = [
      { el: '.about__stat:nth-child(1) .about__stat-number', target: 2, suffix: '' },
      { el: '.about__stat:nth-child(2) .about__stat-number', target: 30, suffix: '+' },
      { el: '.about__stat:nth-child(3) .about__stat-number', target: 1, suffix: 'w+' },
      { el: '.about__stat:nth-child(4) .about__stat-number', target: 500, suffix: 'w+' },
    ]

    statNumbersMobile.forEach(({ el, target, suffix }) => {
      const element = container.querySelector(el)
      if (!element) return
      const counter = { value: 0 }
      tl.to(
        counter,
        {
          value: target,
          duration: 1.0,
          ease: 'power2.out',
          onUpdate: () => {
            element.textContent = Math.round(counter.value) + suffix
          },
        },
        0.6
      )
    })
  })
}

/* ──────────────── Projects Section ──────────────── */

export function createProjectsReveal(container) {
  const mm = gsap.matchMedia()

  // Desktop / Tablet
  mm.add('(min-width: 769px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    })

    // Section label from left
    tl.fromTo(
      '.projects__section-label',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
      0
    )

    // Chinese title — clip-path wipe from bottom
    tl.fromTo(
      '.projects__title',
      { clipPath: 'inset(0 0 100% 0)', y: 15 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.85, ease: 'power4.inOut' },
      0.12
    )

    // Tabs fade in
    tl.fromTo(
      '.projects__tabs',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      0.35
    )

    // Subtabs fade in
    tl.fromTo(
      '.projects__subtabs',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
      0.45
    )
  })

  // Mobile
  mm.add('(max-width: 768px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    })

    tl.fromTo('.projects__section-label', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0)
    tl.fromTo('.projects__title', { clipPath: 'inset(0 0 100% 0)', y: 10 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.65, ease: 'power4.inOut' }, 0.08)
    tl.fromTo('.projects__tabs', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.25)
    tl.fromTo('.projects__subtabs', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.3)
  })
}

/* ──────────────── Footer Section ──────────────── */

export function createFooterReveal(container) {
  const mm = gsap.matchMedia()

  // Desktop / Tablet
  mm.add('(min-width: 769px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 65%',
        toggleActions: 'play none none none',
      },
    })

    // Heading — clip-path wipe from bottom, slow & dramatic
    tl.fromTo(
      '.footer__heading-text',
      { clipPath: 'inset(0 0 100% 0)', y: 20, opacity: 0 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, opacity: 1, duration: 1.1, ease: 'power4.inOut' },
      0
    )

    // Subtitle text
    tl.fromTo(
      '.footer__text',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power4.out' },
      0.4
    )

    // Contact items
    tl.fromTo(
      '.footer__contact-item',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power4.out' },
      0.65
    )

    // Bottom bar
    tl.fromTo(
      '.footer__bottom',
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power3.out' },
      1.0
    )
  })

  // Mobile
  mm.add('(max-width: 768px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    })

    tl.fromTo('.footer__heading-text', { clipPath: 'inset(0 0 100% 0)', y: 12, opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', y: 0, opacity: 1, duration: 0.8, ease: 'power4.inOut' }, 0)
    tl.fromTo('.footer__text', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' }, 0.25)
    tl.fromTo('.footer__contact-item', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power4.out' }, 0.4)
    tl.fromTo('.footer__bottom', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.65)
  })
}
