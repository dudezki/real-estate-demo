<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Menu, Phone, X } from 'lucide-vue-next'
import { useCallStore } from '@/stores/call'
import Button from '@/components/ui/Button.vue'
import BrandMark from '@/components/graphics/BrandMark.vue'

const call = useCallStore()
const solid = ref(false)
const menu = ref(false)
const links = [['Tour', '#tour'], ['Plan', '#plan'], ['Residence', '#residence'], ['Features', '#features'], ['Viewings', '#viewings'], ['Contact', '#contact']]
const current = ref('#tour')
let io: IntersectionObserver | undefined
const onScroll = () => { solid.value = window.scrollY > 40 }
onMounted(() => {
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
  // Highlight the section occupying the middle of the viewport.
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) current.value = `#${e.target.id}`
  }, { rootMargin: '-45% 0px -50% 0px' })
  links.forEach(([, h]) => { const el = document.querySelector(h); if (el) io!.observe(el) })
})
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); io?.disconnect() })
</script>

<template>
  <a href="#main" class="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-signal px-5 py-3 text-sm font-medium text-ink focus:translate-y-0">Skip to content</a>
  <header
    class="fixed inset-x-0 top-0 z-40 transition-colors duration-500"
    :class="solid || menu ? 'border-b border-line bg-ink/90 backdrop-blur-sm' : 'border-b border-transparent'"
  >
    <nav class="container-x flex h-[72px] items-center justify-between" aria-label="Primary">
      <a href="#tour" class="flex items-center gap-2.5" aria-label="HAVEN. Estates home">
        <BrandMark /><span class="display text-2xl">HAVEN<span class="text-signal">.</span></span>
      </a>
      <ul class="hidden items-center gap-9 md:flex">
        <li v-for="[t, h] in links" :key="h">
          <a
            :href="h" :aria-current="current === h ? 'location' : undefined"
            class="relative py-2 text-sm transition-colors hover:text-paper"
            :class="current === h ? 'text-paper' : 'text-paper-dim'"
          >{{ t }}<span
            class="absolute inset-x-0 -bottom-0.5 h-px origin-left bg-signal transition-transform duration-500 ease-out-expo"
            :class="current === h ? 'scale-x-100' : 'scale-x-0'" aria-hidden="true"
          /></a>
        </li>
      </ul>
      <div class="flex items-center gap-2">
        <Button class="hidden sm:inline-flex" :disabled="call.active" @click="call.start()">
          <Phone :size="16" aria-hidden="true" />Talk to concierge
        </Button>
        <button
          class="grid size-11 place-items-center rounded-full md:hidden" :aria-expanded="menu"
          :aria-label="menu ? 'Close menu' : 'Open menu'" @click="menu = !menu"
        ><X v-if="menu" :size="22" /><Menu v-else :size="22" /></button>
      </div>
    </nav>
    <div v-if="menu" class="container-x border-t border-line pb-6 md:hidden">
      <a v-for="[t, h] in links" :key="h" :href="h" class="block py-4 text-lg" @click="menu = false">{{ t }}</a>
      <Button class="mt-2 w-full" :disabled="call.active" @click="menu = false; call.start()"><Phone :size="16" />Talk to concierge</Button>
    </div>
  </header>
</template>
