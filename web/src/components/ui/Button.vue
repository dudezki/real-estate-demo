<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// shadcn-vue pattern: cva variants + cn(), owned in-repo.
const button = cva(
  'inline-flex min-h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-6 text-sm font-medium transition-[transform,background-color,color,border-color] duration-300 ease-out-expo active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        signal: 'bg-signal text-ink hover:bg-paper',
        outline: 'border border-line text-paper hover:border-paper/60',
        ghost: 'text-paper-dim hover:text-paper',
        danger: 'bg-danger text-ink hover:bg-paper',
      },
      size: { default: '', lg: 'min-h-14 px-9 text-base', icon: 'size-11 px-0' },
    },
    defaultVariants: { variant: 'signal', size: 'default' },
  },
)
const props = withDefaults(
  defineProps<{ variant?: 'signal' | 'outline' | 'ghost' | 'danger'; size?: 'default' | 'lg' | 'icon'; class?: string; as?: string }>(),
  { as: 'button' },
)
</script>

<template>
  <component :is="props.as" :class="cn(button({ variant: props.variant, size: props.size }), props.class)">
    <slot />
  </component>
</template>
