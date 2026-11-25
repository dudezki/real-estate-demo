<script setup lang="ts">
import { ref } from 'vue'
import { BatteryCharging, ChefHat, Droplets, Flame, Sun, Waves } from 'lucide-vue-next'
import { useSectionMotion } from '@/composables/useMotion'

const root = ref<HTMLElement>()
useSectionMotion(() => root.value)

const items = [
  { icon: Waves, t: 'Twelve-metre lap pool', d: 'Timber deck, outdoor kitchen and a garden designed for long evenings.' },
  { icon: Flame, t: 'Linear fireplace', d: 'A stone-wrapped gas fire anchors the double-height living room.' },
  { icon: ChefHat, t: 'Open stone kitchen', d: 'A sculpted island, dining for ten and views straight through to the pool.' },
  { icon: Sun, t: 'Roof deck', d: 'The best seat in the house for sunsets, reached by a floating oak stair.' },
  { icon: BatteryCharging, t: 'Solar with storage', d: 'Panels, home battery and an EV charger in the two-car garage.' },
  { icon: Droplets, t: 'Smart and sustainable', d: 'Smart lighting and climate, plus rainwater harvesting for the garden.' },
]
</script>

<template>
  <section id="features" ref="root" class="container-x py-28 sm:py-40">
    <div class="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-24">
      <div class="lg:sticky lg:top-32 lg:self-start">
        <p class="eyebrow" data-reveal>Features</p>
        <h2 class="display mt-5 text-5xl sm:text-7xl" data-reveal="0.1">Considered down to the last detail.</h2>
      </div>
      <ol class="divide-y divide-line border-y border-line">
        <li v-for="(it, i) in items" :key="it.t" class="group grid grid-cols-[3rem_1fr] gap-4 py-8 sm:grid-cols-[4rem_1fr_auto]" data-reveal>
          <span class="font-mono text-sm text-mute">{{ String(i + 1).padStart(2, '0') }}</span>
          <div>
            <h3 class="display text-3xl transition-colors group-hover:text-signal sm:text-4xl">{{ it.t }}</h3>
            <p class="mt-2 max-w-md text-paper-dim">{{ it.d }}</p>
          </div>
          <component :is="it.icon" :size="26" class="hidden text-mute transition-colors group-hover:text-signal sm:block" aria-hidden="true" />
        </li>
      </ol>
    </div>
  </section>
</template>
