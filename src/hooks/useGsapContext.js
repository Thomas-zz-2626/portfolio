import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Reusable hook for GSAP animations with automatic cleanup.
 * Uses gsap.context() scoped to the container ref — all tweens,
 * timelines, and ScrollTriggers created inside are auto-cleaned on unmount.
 *
 * @param {Function} animationFn — receives (container) DOM node
 * @param {Array} deps — dependency array, defaults to []
 * @returns {React.RefObject} containerRef — attach to the root element
 */
export function useGsapContext(animationFn, deps = []) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      animationFn(containerRef.current)
    }, containerRef.current)

    return () => ctx.revert()
  }, deps)

  return containerRef
}
