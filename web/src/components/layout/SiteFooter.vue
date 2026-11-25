<script setup lang="ts">
import BrandMark from '@/components/graphics/BrandMark.vue'
</script>
<template>
  <footer class="container-x flex flex-col items-start justify-between gap-6 py-10 text-sm text-mute sm:flex-row sm:items-center">
    <div class="flex items-center gap-2.5 text-paper"><BrandMark /><span class="display text-xl">HAVEN. Estates</span></div>
    <div class="space-y-1 sm:text-right">
      <p>Designed &amp; built by <span class="text-paper">Lucky John Faderon</span>, AI Solutions Architect</p>
      <p>© {{ new Date().getFullYear() }} HAVEN. Estates. Fictional demonstration listing. Voice sessions are processed by AI providers.</p>
    </div>
  </footer>
</template>
