<script setup lang="ts">
import { useSmoothScroll } from '@/composables/useMotion'
import SiteNav from '@/components/layout/SiteNav.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HouseTour from '@/components/tour/HouseTour.vue'
import BlueprintSection from '@/components/sections/BlueprintSection.vue'
import ResidenceSection from '@/components/sections/ResidenceSection.vue'
import SolutionsSection from '@/components/sections/SolutionsSection.vue'
import HowItWorksSection from '@/components/sections/HowItWorksSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import CallDock from '@/components/voice/CallDock.vue'

useSmoothScroll()
</script>

<template>
  <SiteNav />
  <main id="main" tabindex="-1" class="outline-none">
    <HouseTour /><BlueprintSection /><ResidenceSection /><SolutionsSection /><HowItWorksSection /><ContactSection />
  </main>
  <SiteFooter />
  <CallDock />
</template>
