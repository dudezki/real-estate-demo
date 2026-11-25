<script setup lang="ts">
import { ref } from 'vue'
import { useSectionMotion } from '@/composables/useMotion'
const root = ref<HTMLElement>()
useSectionMotion(() => root.value)
const specs = [['4', 'Bedrooms'], ['4.5', 'Bathrooms'], ['410', 'm² interior'], ['620', 'm² lot']]
</script>

<template>
  <section id="residence" ref="root" class="container-x py-28 sm:py-40">
    <div class="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:items-end">
      <div>
        <p class="eyebrow" data-reveal>The residence</p>
        <h2 class="display mt-5 text-5xl sm:text-7xl" data-reveal="0.1">Light, timber and stone, <span class="italic text-signal">arranged for living.</span></h2>
      </div>
      <p class="max-w-md text-paper-dim" data-reveal>
        Two storeys and a roof deck wrap a double-height living room that opens to a 12-metre lap pool.
        Every room faces the garden; every evening ends on the roof.
      </p>
    </div>
    <dl class="mt-20 grid grid-cols-2 border-t border-line sm:grid-cols-4">
      <div v-for="([v, l], i) in specs" :key="l" class="border-b border-line py-8 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0" data-reveal :data-delay="i">
        <dd class="display text-6xl sm:text-7xl">{{ v }}</dd>
        <dt class="mt-2 text-sm uppercase tracking-widest text-mute">{{ l }}</dt>
      </div>
    </dl>
  </section>
</template>
