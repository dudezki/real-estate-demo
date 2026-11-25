<script setup lang="ts">
import { ref } from 'vue'
import { useSectionMotion } from '@/composables/useMotion'
const root = ref<HTMLElement>()
useSectionMotion(() => root.value)
const steps = [
  ['Ask the concierge', 'Talk to our AI concierge any time — rooms, features, how viewings work.'],
  ['Choose your viewing', 'In person at the gate, or a live video walkthrough from wherever you are.'],
  ['Meet your agent', 'A HAVEN. agent follows up with the details and walks you through the home.'],
]
</script>

<template>
  <section id="viewings" ref="root" class="container-x py-28 sm:py-40">
    <p class="eyebrow" data-reveal>Viewings</p>
    <h2 class="display mt-5 max-w-[16ch] text-5xl sm:text-7xl" data-reveal="0.1">From first question to front door.</h2>
    <div class="relative mt-20 grid gap-14 md:grid-cols-3 md:gap-8">
      <!-- Connector line draws as you scroll -->
      <svg class="absolute left-0 top-5 hidden h-3 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2" aria-hidden="true">
        <path d="M0 1 H100" stroke="#e8a24a" stroke-width="0.4" vector-effect="non-scaling-stroke" fill="none" data-draw />
      </svg>
      <div v-for="(s, i) in steps" :key="s[0]" data-reveal :data-delay="i">
        <span class="relative z-10 grid size-10 place-items-center rounded-full border border-signal bg-ink font-mono text-sm text-signal">{{ i + 1 }}</span>
        <h3 class="display mt-8 text-3xl">{{ s[0] }}</h3>
        <p class="mt-3 max-w-xs text-paper-dim">{{ s[1] }}</p>
      </div>
    </div>
  </section>
</template>
