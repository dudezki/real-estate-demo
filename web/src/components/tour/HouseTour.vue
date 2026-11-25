<script setup lang="ts">
/**
 * Scroll-driven property tour: gate opens → facade labels → camera pushes through the
 * front door → interior with labelled rooms. Pure SVG + GSAP ScrollTrigger (scrubbed, pinned).
 * Reduced-motion users get a static, fully labelled two-frame version instead.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Mic } from 'lucide-vue-next'
import { gsap } from '@/composables/useMotion'
import { prefersReducedMotion } from '@/lib/utils'
import { useCallStore } from '@/stores/call'
import Button from '@/components/ui/Button.vue'

const call = useCallStore()
const root = ref<HTMLElement>()
const reduced = ref(false)
const narrow = ref(false)
let mm: gsap.MatchMedia | undefined

// Door centre in viewBox units: the camera's zoom target.
const DOOR = { x: 800, y: 640 }

const outsideLabels = [
  { x: 900, y: 300, tx: 1010, ty: 205, t: 'Roof deck', s: 'Sunset views' },
  { x: 700, y: 400, tx: 380, ty: 250, t: 'Primary suite', s: 'Walk-in wardrobe, stone bath' },
  { x: 1050, y: 590, tx: 1280, ty: 470, t: 'Double-height living', s: 'Floor-to-ceiling glass' },
  { x: 560, y: 640, tx: 190, ty: 520, t: 'Two-car garage', s: 'With EV charger' },
  { x: 1180, y: 780, tx: 1330, ty: 690, t: 'Landscaped garden', s: 'Gated, private entry' },
]
const insideLabels = [
  { x: 620, y: 300, tx: 640, ty: 150, t: 'Floor-to-ceiling glass', s: 'Overlooks the 12 m lap pool' },
  { x: 1270, y: 435, tx: 1180, ty: 250, t: 'Linear fireplace', s: 'Gas, stone surround' },
  { x: 420, y: 690, tx: 120, ty: 560, t: 'Stone kitchen island', s: 'Open kitchen, dining for ten' },
  { x: 1440, y: 560, tx: 1250, ty: 760, t: 'Floating oak staircase', s: 'To three en-suite bedrooms' },
  { x: 420, y: 330, tx: 120, ty: 380, t: 'Pendant lighting', s: 'Smart-home controlled' },
]
const pillW = (l: { t: string; s: string }) => Math.max(l.t.length * 13.5, l.s.length * 9.2) + 40

const setNarrow = () => { narrow.value = window.innerWidth / window.innerHeight < 1 }

onMounted(async () => {
  reduced.value = prefersReducedMotion()
  setNarrow()
  window.addEventListener('resize', setNarrow)
  if (reduced.value) return
  await nextTick() // label markup differs on narrow screens: bind GSAP to what is rendered

  mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const q = gsap.utils.selector(root.value!)
    gsap.set(q('[data-out-label], [data-in-label]'), { opacity: 0, y: 12 })
    gsap.set(q('[data-inside]'), { opacity: 0, scale: 1.14, svgOrigin: '800 450' })
    gsap.set(q('[data-flash]'), { opacity: 0 })
    gsap.set(q('[data-chapter]'), { opacity: 0, y: 10 })

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root.value, start: 'top top', end: '+=520%', scrub: 0.8, pin: true, anticipatePin: 1 },
    })
    tl.to(q('[data-intro]'), { opacity: 0, y: -40, duration: 0.6 }, 0)
      .to(q('[data-scroll-hint]'), { opacity: 0, duration: 0.3 }, 0)
      .to(q('[data-chapter="1"]'), { opacity: 1, y: 0, duration: 0.3 }, 0.3)
      // 1 · Arrival: the gate swings open.
      .to(q('[data-gate="l"]'), { scaleX: 0.08, svgOrigin: '612 0', duration: 1, ease: 'power1.inOut' }, 0.2)
      .to(q('[data-gate="r"]'), { scaleX: 0.08, svgOrigin: '988 0', duration: 1, ease: 'power1.inOut' }, 0.2)
      .to(q('[data-world]'), { scale: 1.25, svgOrigin: `${DOOR.x} ${DOOR.y}`, duration: 1.2 }, 0.2)
      // 2 · Facade: label the parts of the house.
      .to(q('[data-chapter="1"]'), { opacity: 0, duration: 0.3 }, 1.3)
      .to(q('[data-chapter="2"]'), { opacity: 1, y: 0, duration: 0.3 }, 1.4)
      .to(q('[data-out-label]'), { opacity: 1, y: 0, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 1.4)
      .to({}, { duration: 0.7 })
      .to(q('[data-out-label]'), { opacity: 0, duration: 0.3 }, 2.9)
      .to(q('[data-chapter="2"]'), { opacity: 0, duration: 0.3 }, 2.9)
      // 3 · Approach: push in through the front door as it swings open.
      .to(q('[data-world]'), { scale: 11, svgOrigin: `${DOOR.x} ${DOOR.y}`, duration: 1.8, ease: 'power2.in' }, 3.0)
      .to(q('[data-door]'), { scaleX: 0.12, svgOrigin: '772 0', duration: 0.8, ease: 'power1.inOut' }, 3.4)
      .to(q('[data-flash]'), { opacity: 1, duration: 0.35 }, 4.45)
      // 4 · Inside: the light settles into the living room.
      .to(q('[data-inside]'), { opacity: 1, duration: 0.3 }, 4.75)
      .to(q('[data-outside]'), { opacity: 0, duration: 0.2 }, 4.75)
      .to(q('[data-flash]'), { opacity: 0, duration: 0.6 }, 4.85)
      .to(q('[data-inside]'), { scale: 1, svgOrigin: '800 450', duration: 1.1, ease: 'power2.out' }, 4.75)
      .to(q('[data-chapter="3"]'), { opacity: 1, y: 0, duration: 0.3 }, 5.2)
      .to(q('[data-in-label]'), { opacity: 1, y: 0, stagger: 0.14, duration: 0.35, ease: 'power2.out' }, 5.4)
      .to({}, { duration: 0.9 })

    // Gentle life while idle: pillar lights flicker, pool shimmers.
    gsap.to(q('[data-lamp]'), { opacity: 0.55, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.4 })
    gsap.to(q('[data-shimmer]'), { x: 30, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  })
})
onBeforeUnmount(() => { mm?.revert(); window.removeEventListener('resize', setNarrow) })
</script>

<template>
  <section id="tour" ref="root" class="relative bg-[#141824]" aria-label="Scroll tour of The Alba Residence">
    <!-- Text alternative for the illustrated tour -->
    <div class="sr-only">
      <h2>Tour of The Alba Residence</h2>
      <ul>
        <li v-for="l in [...outsideLabels, ...insideLabels]" :key="l.t">{{ l.t }}: {{ l.s }}</li>
      </ul>
    </div>

    <div :class="reduced ? 'space-y-px' : 'relative h-svh overflow-hidden'">
      <!-- ============ EXTERIOR ============ -->
      <svg
        data-outside :class="reduced ? 'block aspect-video w-full' : 'absolute inset-0 size-full'"
        viewBox="0 0 1600 900" :preserveAspectRatio="narrow ? 'xMidYMid meet' : 'xMidYMid slice'" aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#141824" /><stop offset="0.55" stop-color="#3a3242" /><stop offset="0.8" stop-color="#b9785a" /><stop offset="1" stop-color="#e0a56f" />
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffcf8f" /><stop offset="1" stop-color="#d98a45" />
          </linearGradient>
          <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1f2a22" /><stop offset="1" stop-color="#0e130f" />
          </linearGradient>
          <linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#8d7f6c" /><stop offset="1" stop-color="#4a4136" />
          </linearGradient>
          <radialGradient id="doorGlow" cx="0.5" cy="0.6" r="0.6">
            <stop offset="0" stop-color="#ffe2b0" /><stop offset="1" stop-color="#f0a860" />
          </radialGradient>
          <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd49a" stop-opacity="0.9" /><stop offset="1" stop-color="#ffd49a" stop-opacity="0" /></radialGradient>
          <pattern id="slats" width="14" height="20" patternUnits="userSpaceOnUse">
            <rect width="14" height="20" fill="#6e4b30" /><rect width="3" height="20" fill="#4d3321" />
          </pattern>
          <pattern id="stone" width="60" height="30" patternUnits="userSpaceOnUse">
            <rect width="60" height="30" fill="#7d776c" /><path d="M0 15h60M30 0v15M10 15v15M45 15v15" stroke="#5f5a51" stroke-width="2" />
          </pattern>
          <pattern id="gateSlats" width="16" height="10" patternUnits="userSpaceOnUse">
            <rect width="16" height="10" fill="none" /><rect width="9" height="10" fill="#8a6a45" />
          </pattern>
        </defs>

        <g data-world>
          <rect width="1600" height="900" fill="url(#sky)" />
          <!-- stars + hills -->
          <g fill="#f1ece3" opacity="0.5"><circle cx="180" cy="90" r="1.5" /><circle cx="420" cy="60" r="1" /><circle cx="1320" cy="110" r="1.4" /><circle cx="1480" cy="50" r="1" /><circle cx="960" cy="40" r="1.2" /></g>
          <path d="M0 560 Q 300 470 620 540 T 1200 520 T 1600 540 V900 H0Z" fill="#2a2a36" opacity="0.8" />

          <!-- trees -->
          <g fill="#121a15">
            <ellipse cx="260" cy="560" rx="120" ry="150" /><rect x="252" y="600" width="16" height="150" />
            <ellipse cx="1400" cy="540" rx="140" ry="170" /><rect x="1392" y="600" width="16" height="160" />
            <ellipse cx="1520" cy="620" rx="90" ry="110" />
          </g>

          <!-- HOUSE -->
          <!-- upper volume (cantilevered, timber slats) -->
          <rect x="520" y="330" width="740" height="140" fill="url(#slats)" />
          <rect x="590" y="360" width="420" height="80" fill="url(#glass)" opacity="0.92" />
          <path d="M590 360h420M730 360v80M870 360v80" stroke="#2b2620" stroke-width="4" />
          <!-- roof slab + glass balustrade -->
          <rect x="500" y="316" width="790" height="16" fill="#1d1b19" />
          <rect x="860" y="282" width="400" height="34" fill="#9fb4c7" opacity="0.25" stroke="#cfd8df" stroke-opacity="0.4" />
          <!-- ground volume -->
          <rect x="420" y="470" width="760" height="250" fill="#e8e1d3" />
          <rect x="420" y="470" width="300" height="250" fill="url(#stone)" />
          <!-- garage -->
          <rect x="450" y="560" width="250" height="160" fill="#2a2622" />
          <path d="M450 580h250M450 600h250M450 620h250M450 640h250M450 660h250M450 680h250M450 700h250" stroke="#3a342e" stroke-width="3" />
          <!-- living glazing (double height feel) -->
          <rect x="860" y="500" width="290" height="220" fill="url(#glass)" />
          <path d="M957 500v220M1053 500v220" stroke="#2b2620" stroke-width="5" />
          <g stroke="#6b3f1f" stroke-width="2"><path d="M910 500v60M1005 500v50M1100 500v65" /></g>
          <g fill="#fff0d0"><circle cx="910" cy="566" r="9" /><circle cx="1005" cy="556" r="9" /><circle cx="1100" cy="571" r="9" /></g>
          <!-- front door: frame + warm interior + pivot panel -->
          <rect x="764" y="552" width="72" height="170" fill="#1a1715" />
          <rect x="772" y="560" width="56" height="160" fill="url(#doorGlow)" />
          <g data-door>
            <rect x="772" y="560" width="56" height="160" fill="#5a3b24" />
            <path d="M784 560v160M796 560v160M808 560v160M820 560v160" stroke="#47301d" stroke-width="2" />
            <rect x="816" y="610" width="4" height="50" fill="#d6b07a" />
          </g>
          <rect x="740" y="548" width="120" height="8" fill="#1d1b19" />
          <!-- lawn + path -->
          <rect x="0" y="720" width="1600" height="180" fill="url(#lawn)" />
          <path d="M770 720 H830 L960 900 H640 Z" fill="url(#path)" />
          <!-- pool shimmer at right -->
          <rect x="1180" y="730" width="300" height="30" rx="4" fill="#3d7c8c" opacity="0.6" />
          <rect data-shimmer x="1200" y="738" width="120" height="4" rx="2" fill="#bfe6ef" opacity="0.5" />

          <!-- boundary wall, pillars, gate -->
          <rect x="0" y="790" width="612" height="80" fill="url(#stone)" />
          <rect x="988" y="790" width="612" height="80" fill="url(#stone)" />
          <rect x="0" y="782" width="612" height="10" fill="#5c564d" /><rect x="988" y="782" width="612" height="10" fill="#5c564d" />
          <rect x="582" y="640" width="30" height="240" fill="url(#stone)" /><rect x="988" y="640" width="30" height="240" fill="url(#stone)" />
          <rect x="578" y="630" width="38" height="12" fill="#3f3a33" /><rect x="984" y="630" width="38" height="12" fill="#3f3a33" />
          <circle data-lamp cx="597" cy="620" r="40" fill="url(#lampGlow)" /><circle data-lamp cx="1003" cy="620" r="40" fill="url(#lampGlow)" />
          <rect x="590" y="612" width="14" height="18" fill="#ffd49a" /><rect x="996" y="612" width="14" height="18" fill="#ffd49a" />
          <g data-gate="l">
            <rect x="612" y="660" width="188" height="210" fill="url(#gateSlats)" />
            <rect x="612" y="660" width="188" height="8" fill="#6f5233" /><rect x="612" y="862" width="188" height="8" fill="#6f5233" />
          </g>
          <g data-gate="r">
            <rect x="800" y="660" width="188" height="210" fill="url(#gateSlats)" />
            <rect x="800" y="660" width="188" height="8" fill="#6f5233" /><rect x="800" y="862" width="188" height="8" fill="#6f5233" />
          </g>
        </g>

        <!-- facade labels (not scaled with the camera) -->
        <template v-if="!narrow"><g v-for="l in outsideLabels" :key="l.t" data-out-label :opacity="reduced ? 1 : 0" font-family="Inter Variable, sans-serif">
          <line :x1="l.x" :y1="l.y" :x2="l.tx + 10" :y2="l.ty + 30" stroke="#f1ece3" stroke-opacity="0.6" stroke-width="1.5" />
          <circle :cx="l.x" :cy="l.y" r="7" fill="#e8a24a" stroke="#141824" stroke-width="3" />
          <rect :x="l.tx" :y="l.ty" :width="pillW(l)" height="60" rx="10" fill="#141210" fill-opacity="0.88" stroke="#f1ece3" stroke-opacity="0.15" />
          <text :x="l.tx + 18" :y="l.ty + 26" fill="#f1ece3" font-size="20" font-weight="600">{{ l.t }}</text>
          <text :x="l.tx + 18" :y="l.ty + 48" fill="#b9b1a4" font-size="15">{{ l.s }}</text>
        </g></template>
      </svg>

      <!-- ============ INTERIOR ============ -->
      <svg
        :class="reduced ? 'block aspect-video w-full' : 'absolute inset-0 size-full'"
        viewBox="0 0 1600 900" :preserveAspectRatio="narrow ? 'xMidYMid meet' : 'xMidYMid slice'" aria-hidden="true"
        :style="reduced ? '' : 'pointer-events:none'"
      >
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b241d" /><stop offset="1" stop-color="#4a3c2e" /></linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5536" /><stop offset="1" stop-color="#3e2a1b" /></linearGradient>
          <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f45" /><stop offset="0.7" stop-color="#c47e58" /><stop offset="1" stop-color="#e5ae78" /></linearGradient>
          <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a3" /><stop offset="1" stop-color="#ff8a3c" /></linearGradient>
          <radialGradient id="pendant"><stop offset="0" stop-color="#fff3d6" /><stop offset="0.4" stop-color="#ffcf8f" stop-opacity="0.7" /><stop offset="1" stop-color="#ffcf8f" stop-opacity="0" /></radialGradient>
        </defs>
        <g data-inside :opacity="reduced ? 1 : 0">
          <rect width="1600" height="900" fill="url(#wall)" />
          <!-- back window: dusk + pool -->
          <rect x="240" y="110" width="780" height="520" fill="url(#dusk)" />
          <path d="M240 520 Q 520 470 1020 500 V630 H240Z" fill="#26303a" />
          <rect x="300" y="560" width="660" height="50" fill="#4a93a3" opacity="0.8" />
          <rect x="340" y="575" width="200" height="5" rx="2" fill="#cdeff6" opacity="0.6" />
          <path d="M240 110h780v520H240z M500 110v520 M760 110v520" fill="none" stroke="#1b1714" stroke-width="10" />
          <!-- fireplace wall -->
          <rect x="1050" y="250" width="440" height="380" fill="#24201c" />
          <rect x="1090" y="410" width="360" height="50" fill="#120f0d" />
          <path d="M1100 455 q30 -40 60 0 q30 -45 60 0 q30 -38 60 0 q30 -44 60 0 q30 -40 60 0 q20 -30 40 0" fill="url(#flame)" />
          <!-- floor -->
          <path d="M0 630 H1600 V900 H0Z" fill="url(#floor)" />
          <g stroke="#2f2015" stroke-opacity="0.5" stroke-width="2"><path d="M800 630 L200 900 M800 630 L500 900 M800 630 L800 900 M800 630 L1100 900 M800 630 L1400 900" /></g>
          <!-- staircase -->
          <g fill="#a87a4e">
            <rect v-for="i in 8" :key="i" :x="1300 + i * 22" :y="820 - i * 70" width="200" height="16" rx="2" />
          </g>
          <rect x="1560" y="200" width="8" height="640" fill="#1b1714" />
          <!-- sofa + rug -->
          <ellipse cx="880" cy="760" rx="300" ry="40" fill="#6d5a46" opacity="0.6" />
          <rect x="700" y="660" width="380" height="70" rx="18" fill="#d9cfbf" />
          <rect x="700" y="640" width="380" height="40" rx="16" fill="#c7bba8" />
          <!-- pendants -->
          <g stroke="#1b1714" stroke-width="2"><path d="M300 0v440M420 0v460M540 0v440" /></g>
          <circle cx="300" cy="455" r="90" fill="url(#pendant)" /><circle cx="420" cy="475" r="90" fill="url(#pendant)" /><circle cx="540" cy="455" r="90" fill="url(#pendant)" />
          <g fill="#fff3d6"><circle cx="300" cy="452" r="16" /><circle cx="420" cy="472" r="16" /><circle cx="540" cy="452" r="16" /></g>
          <!-- kitchen island (foreground) -->
          <rect x="100" y="660" width="640" height="34" fill="#e9e4da" />
          <rect x="120" y="694" width="600" height="160" fill="#2f2a25" />
          <g fill="#1b1714"><rect x="200" y="740" width="10" height="150" /><rect x="400" y="740" width="10" height="150" /><rect x="600" y="740" width="10" height="150" /></g>
          <g fill="#8a6a45"><rect x="170" y="730" width="70" height="14" rx="6" /><rect x="370" y="730" width="70" height="14" rx="6" /><rect x="570" y="730" width="70" height="14" rx="6" /></g>
        </g>
        <!-- interior labels -->
        <template v-if="!narrow"><g v-for="l in insideLabels" :key="l.t" data-in-label :opacity="reduced ? 1 : 0" font-family="Inter Variable, sans-serif">
          <line :x1="l.x" :y1="l.y" :x2="l.tx + 10" :y2="l.ty + 30" stroke="#f1ece3" stroke-opacity="0.6" stroke-width="1.5" />
          <circle :cx="l.x" :cy="l.y" r="7" fill="#e8a24a" stroke="#141210" stroke-width="3" />
          <rect :x="l.tx" :y="l.ty" :width="pillW(l)" height="60" rx="10" fill="#141210" fill-opacity="0.88" stroke="#f1ece3" stroke-opacity="0.15" />
          <text :x="l.tx + 18" :y="l.ty + 26" fill="#f1ece3" font-size="20" font-weight="600">{{ l.t }}</text>
          <text :x="l.tx + 18" :y="l.ty + 48" fill="#b9b1a4" font-size="15">{{ l.s }}</text>
        </g></template>
      </svg>

      <!-- Narrow screens: labels as readable chips under the illustration -->
      <template v-if="narrow && !reduced">
        <ul class="absolute inset-x-4 bottom-20 flex flex-wrap gap-2" aria-hidden="true">
          <li v-for="l in outsideLabels" :key="l.t" data-out-label class="rounded-full border border-line bg-ink/85 px-3 py-1.5 text-xs">
            <span class="font-semibold text-paper">{{ l.t }}</span> <span class="text-paper-dim">· {{ l.s }}</span>
          </li>
        </ul>
        <ul class="absolute inset-x-4 bottom-20 flex flex-wrap gap-2" aria-hidden="true">
          <li v-for="l in insideLabels" :key="l.t" data-in-label class="rounded-full border border-line bg-ink/85 px-3 py-1.5 text-xs">
            <span class="font-semibold text-paper">{{ l.t }}</span> <span class="text-paper-dim">· {{ l.s }}</span>
          </li>
        </ul>
      </template>

      <!-- doorway light flash between scenes -->
      <div v-if="!reduced" data-flash class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,#fff1d6,#f0a860_70%)]" />

      <!-- Intro copy over the gate -->
      <div v-if="!reduced" data-intro class="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#141824]/90 via-[#141824]/45 to-transparent pt-32 sm:pt-40">
        <div class="container-x">
          <p class="eyebrow">HAVEN. Estates · Private listing</p>
          <h1 class="display mt-5 max-w-[13ch] text-[clamp(3rem,8vw,7.5rem)]">The Alba <span class="italic text-signal">Residence.</span></h1>
          <p class="mt-6 max-w-md text-lg text-paper-dim">A contemporary four-bedroom villa behind a private gate. Scroll to step inside — or ask our concierge anything.</p>
          <Button size="lg" class="pointer-events-auto mt-8" :class="call.active ? '' : 'cta-pulse'" :disabled="call.active" @click="call.start()">
            <Mic :size="20" aria-hidden="true" />Talk to our concierge
          </Button>
        </div>
      </div>
      <p v-if="!reduced" data-scroll-hint class="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-paper-dim">Scroll to enter</p>

      <!-- Chapter captions -->
      <div v-if="!reduced" class="pointer-events-none absolute bottom-8 left-0 right-0">
        <div class="container-x">
          <p data-chapter="1" class="absolute display text-3xl">01 <span class="text-paper-dim">— Arrival</span></p>
          <p data-chapter="2" class="absolute display text-3xl">02 <span class="text-paper-dim">— The façade</span></p>
          <p data-chapter="3" class="absolute display text-3xl">03 <span class="text-paper-dim">— Inside</span></p>
        </div>
      </div>
    </div>

    <!-- Reduced-motion header (static version) -->
    <div v-if="reduced" class="container-x py-16">
      <h1 class="display text-6xl">The Alba <span class="italic text-signal">Residence.</span></h1>
      <Button size="lg" class="mt-8" :disabled="call.active" @click="call.start()"><Mic :size="20" aria-hidden="true" />Talk to our concierge</Button>
    </div>
  </section>
</template>
