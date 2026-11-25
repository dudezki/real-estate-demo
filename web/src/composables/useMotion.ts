import { onBeforeUnmount, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

/** Lenis smooth scroll driven by the GSAP ticker; disabled for reduced-motion users. */
export function useSmoothScroll() {
  let lenis: Lenis | undefined
  const tick = (t: number) => lenis?.raf(t * 1000)
  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 } })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
  })
  onBeforeUnmount(() => { gsap.ticker.remove(tick); lenis?.destroy() })
}

/**
 * Scroll-linked motion for a section root. `[data-reveal]` fades/rises in,
 * `[data-parallax="0.2"]` drifts, `[data-draw]` strokes draw on scroll.
 * Everything is skipped (final state shown) under prefers-reduced-motion.
 */
export function useSectionMotion(getRoot: () => HTMLElement | undefined) {
  let mm: gsap.MatchMedia | undefined
  onMounted(() => {
    const root = getRoot()
    if (!root) return
    mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', delay: Number(el.dataset.reveal) || 0,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      root.querySelectorAll<SVGGeometryElement>('[data-draw]').forEach((p) => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 40%', scrub: 0.6 } })
      })
      root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.to(el, {
          yPercent: Number(el.dataset.parallax) * 100, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    })
  })
  onBeforeUnmount(() => mm?.revert())
}

export { gsap, ScrollTrigger }
