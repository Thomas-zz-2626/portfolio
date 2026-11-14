import gsap from 'gsap'

/**
 * Hero opening animation — plays immediately on mount.
 * Choreography:
 *   0.00s  Container revealed
 *   0.30s  Kicker line wipes from left
 *   0.40s  Kicker label fades up
 *   0.55s  Title text: clip-path wipe bottom→top + scale 1.12→1.0 + y settle
 *   1.60s  Subtitle fades up
 *   2.20s  Scroll indicator fades in
 */
export function createHeroEntrance(container) {
  // 「减弱动态效果」：跳过整套编排，直接呈现最终状态。
  // Hero.css 为防 FOUC 给各元素写了初始 opacity:0，这里必须显式恢复。
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('.hero__inner', { opacity: 1 })
    gsap.set('.hero__kicker', { opacity: 1 })
    gsap.set('.hero__line', { scaleX: 1 })
    gsap.set('.hero__label', { opacity: 1, y: 0 })
    gsap.set('.hero__title-text', { clipPath: 'inset(0 0 0% 0)', scale: 1, y: 0, opacity: 1 })
    gsap.set('.hero__subtitle', { opacity: 1, y: 0 })
    gsap.set('.hero__scroll', { opacity: 0.7 })
    return gsap.timeline()
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  // Reveal container instantly
  tl.set('.hero__inner', { opacity: 1 })

  // Kicker 包装层的 CSS opacity:0（防 FOUC）没有被任何 tween 揭示——既有 bug。
  // 在子元素开始动之前恢复：此刻线与标签都还不可见，跳变本身不可见。
  tl.set('.hero__kicker', { opacity: 1 }, 0.3)

  // Kicker line — expand from left
  tl.fromTo(
    '.hero__line',
    { scaleX: 0 },
    { scaleX: 1, duration: 0.55, ease: 'power4.out' },
    0.4
  )

  // Kicker label — fade up
  tl.fromTo(
    '.hero__label',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' },
    0.5
  )

  // Title — clip-path wipe + scale settle
  tl.fromTo(
    '.hero__title-text',
    {
      clipPath: 'inset(0 0 100% 0)',
      scale: 1.12,
      y: -10,
      opacity: 0,
    },
    {
      clipPath: 'inset(0 0 0% 0)',
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'power4.inOut',
    },
    0.65
  )

  // Subtitle — gentle fade up
  tl.fromTo(
    '.hero__subtitle',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.75, ease: 'power4.out' },
    1.6
  )

  // Scroll indicator — appears last
  tl.fromTo(
    '.hero__scroll',
    { opacity: 0 },
    { opacity: 0.7, duration: 0.6, ease: 'power3.out' },
    2.2
  )

  return tl
}
