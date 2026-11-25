<script setup lang="ts">
/**
 * Ground-floor blueprint of The Alba Residence. Walls, doors and dimensions draw themselves as the
 * section scrolls (scrubbed GSAP via [data-plan-draw]); room names reveal after their walls.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from '@/composables/useMotion'

const root = ref<HTMLElement>()
let mm: gsap.MatchMedia | undefined

const rooms = [
  { x: 450, y: 300, t: 'Kitchen & dining', a: '42 m²' },
  { x: 925, y: 610, t: 'Living — double height', a: '64 m²' },
  { x: 350, y: 720, t: 'Garage', a: '2 cars · EV' },
  { x: 600, y: 760, t: 'Entry', a: '' },
  { x: 1275, y: 330, t: 'Guest suite', a: '24 m²' },
  { x: 1275, y: 820, t: 'Stair', a: 'to level 1' },
  { x: 950, y: 82, t: 'Lap pool', a: '12 m' },
]

onMounted(() => {
  mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const q = gsap.utils.selector(root.value!)
    const strokes = q('[data-plan-draw]') as unknown as SVGGeometryElement[]
    strokes.forEach((p) => {
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
    })
    gsap.set(q('[data-room]'), { opacity: 0, y: 10 })
    gsap.set(q('[data-grid]'), { opacity: 0 })
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: q('[data-plan]')[0], start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    })
    tl.to(q('[data-grid]'), { opacity: 1, duration: 0.3 })
      .to(strokes, { strokeDashoffset: 0, duration: 1, stagger: 0.04 }, 0.1)
      .to(q('[data-room]'), { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 0.8)
  })
})
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <section id="plan" ref="root" class="relative overflow-hidden bg-[#0f2236] py-28 text-[#dbe8f5] sm:py-36">
    <div class="container-x">
      <div class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-[#8fb1d1]">The plan · Ground floor</p>
          <h2 class="display mt-5 max-w-[16ch] text-5xl sm:text-7xl">Everything you just walked through, <span class="italic text-signal">on paper.</span></h2>
        </div>
        <p class="max-w-xs text-sm text-[#a9c3dc]">Indicative plan for a fictional listing. Areas are approximate.</p>
      </div>

      <figure class="mt-14">
        <svg data-plan viewBox="0 0 1600 1000" class="h-auto w-full" role="img"
          aria-label="Ground-floor plan: kitchen and dining, double-height living room with fireplace, entry, garage, guest suite and stair, with the lap pool beyond the living room glass.">
          <defs>
            <pattern id="bpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#2c4a69" stroke-width="1" />
            </pattern>
          </defs>
          <rect data-grid width="1600" height="1000" fill="url(#bpGrid)" />

          <g fill="none" stroke="#e6f0fa" stroke-linecap="square">
            <!-- outer walls (thick) -->
            <path data-plan-draw d="M200 150H1400V850H760M690 850H200V150" stroke-width="10" />
            <!-- interior walls -->
            <path data-plan-draw d="M200 550H520M600 550H700V400" stroke-width="6" />
            <path data-plan-draw d="M700 300V150" stroke-width="6" />
            <path data-plan-draw d="M500 550V850" stroke-width="6" />
            <path data-plan-draw d="M1150 150V420M1150 500V850" stroke-width="6" />
            <path data-plan-draw d="M1150 550H1400" stroke-width="6" />
            <!-- living glazing to pool (thin double line) -->
            <path data-plan-draw d="M720 150H1130M720 162H1130" stroke="#8fd0ff" stroke-width="3" />
            <!-- front door swing -->
            <path data-plan-draw d="M690 850V780A70 70 0 0 1 760 850" stroke-width="2.5" />
            <!-- kitchen door swing + island -->
            <path data-plan-draw d="M520 550V480A80 80 0 0 1 600 550" stroke-width="2.5" />
            <path data-plan-draw d="M320 340H580V390H320Z" stroke-width="3" />
            <!-- guest suite door -->
            <path data-plan-draw d="M1150 420H1210A80 80 0 0 1 1150 500" stroke-width="2.5" />
            <!-- fireplace -->
            <path data-plan-draw d="M1120 600H1150V740H1120Z" stroke="#e8a24a" stroke-width="4" />
            <!-- stair treads -->
            <path data-plan-draw d="M1180 580V830M1215 580V830M1250 580V830M1285 580V830M1320 580V830M1355 580V830" stroke-width="2" />
            <path data-plan-draw d="M1170 705H1390" stroke-width="2" stroke-dasharray="6 6" />
            <!-- garage door -->
            <path data-plan-draw d="M230 850H470" stroke-width="3" stroke-dasharray="12 8" />
            <!-- pool + deck -->
            <path data-plan-draw d="M650 50H1300V115H650Z" stroke="#8fd0ff" stroke-width="3" />
            <!-- dimension lines -->
            <path data-plan-draw d="M200 920H1400M200 905V935M1400 905V935" stroke="#8fb1d1" stroke-width="1.5" />
            <path data-plan-draw d="M1470 150V850M1455 150H1485M1455 850H1485" stroke="#8fb1d1" stroke-width="1.5" />
          </g>

          <g font-family="Inter Variable, sans-serif" text-anchor="middle">
            <g v-for="r in rooms" :key="r.t" data-room>
              <text :x="r.x" :y="r.y" fill="#f1f6fb" font-size="22" font-weight="600">{{ r.t }}</text>
              <text v-if="r.a" :x="r.x" :y="r.y + 26" fill="#8fb1d1" font-size="16">{{ r.a }}</text>
            </g>
            <text data-room x="800" y="965" fill="#8fb1d1" font-size="16">24.0 m</text>
            <g data-room><text x="1530" y="505" fill="#8fb1d1" font-size="16" transform="rotate(-90 1530 505)">14.0 m</text></g>
          </g>
          <!-- north arrow -->
          <g data-room><g transform="translate(120 120)" stroke="#e6f0fa" fill="none" stroke-width="2">
            <circle r="34" /><path d="M0 -26L10 16L0 8L-10 16Z" fill="#e8a24a" stroke="none" />
            <text y="-42" text-anchor="middle" fill="#e6f0fa" stroke="none" font-size="16" font-family="Inter Variable, sans-serif">N</text>
          </g></g>
        </svg>
      </figure>
    </div>
  </section>
</template>
