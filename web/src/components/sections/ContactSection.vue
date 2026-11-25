<script setup lang="ts">
import { ref } from 'vue'
import { Mail, MapPin, Mic } from 'lucide-vue-next'
import { useCallStore } from '@/stores/call'
import { useSectionMotion } from '@/composables/useMotion'
import Button from '@/components/ui/Button.vue'
const call = useCallStore()
const root = ref<HTMLElement>()
useSectionMotion(() => root.value)
</script>

<template>
  <section id="contact" ref="root" class="border-t border-line bg-signal py-28 text-ink sm:py-40">
    <div class="container-x">
      <h2 class="display max-w-[18ch] text-6xl sm:text-8xl" data-reveal>Come home to Alba.</h2>
      <div class="mt-14 flex flex-wrap items-center gap-x-12 gap-y-6" data-reveal="0.1">
        <Button variant="danger" size="lg" class="bg-ink text-paper hover:bg-paper hover:text-ink" :disabled="call.active" @click="call.start()">
          <Mic :size="20" aria-hidden="true" />Talk to our concierge
        </Button>
        <!-- Placeholder contact details: replace before launch. -->
        <a href="mailto:viewings@haven.example" class="flex items-center gap-2 underline-offset-4 hover:underline"><Mail :size="18" aria-hidden="true" />viewings@haven.example</a>
        <span class="flex items-center gap-2"><MapPin :size="18" aria-hidden="true" />Viewings by appointment</span>
      </div>
    </div>
  </section>
</template>
