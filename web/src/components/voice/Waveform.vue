<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useCallStore } from '@/stores/call'
import { prefersReducedMotion } from '@/lib/utils'

const props = withDefaults(defineProps<{ source: 'user' | 'agent'; bars?: number; active?: boolean; color?: string }>(), {
  bars: 28, active: true, color: '#e8a24a',
})
const canvas = ref<HTMLCanvasElement>()
const call = useCallStore()
let raf = 0
let smooth: number[] = []

function draw(t: number) {
  const c = canvas.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = c.clientWidth, h = c.clientHeight
  if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr }
  const g = c.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, w, h)

  const live = props.active ? call.levels(props.source, props.bars) : new Array(props.bars).fill(0)
  const gap = 3, bw = Math.max(2, (w - gap * (props.bars - 1)) / props.bars)
  g.fillStyle = props.color
  for (let i = 0; i < props.bars; i++) {
    // Low idle "breathing" so the bar never looks dead; real audio level rides on top.
    const idle = 0.06 + 0.04 * Math.sin(t / 600 + i * 0.6)
    const target = prefersReducedMotion() ? Math.max(idle, live[i]) : Math.max(idle, live[i])
    smooth[i] = (smooth[i] ?? 0) + (target - (smooth[i] ?? 0)) * 0.3
    const bh = Math.max(3, smooth[i] * h)
    const x = i * (bw + gap)
    g.beginPath()
    g.roundRect(x, (h - bh) / 2, bw, bh, bw / 2)
    g.fill()
  }
  raf = requestAnimationFrame(draw)
}
onMounted(() => { raf = requestAnimationFrame(draw) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="canvas" class="block h-full w-full" aria-hidden="true" />
</template>
