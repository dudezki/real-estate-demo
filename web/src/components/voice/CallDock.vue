<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Captions, Mic, MicOff, PhoneOff, RotateCcw, X } from 'lucide-vue-next'
import { useCallStore } from '@/stores/call'
import { formatDuration } from '@/lib/utils'
import Button from '@/components/ui/Button.vue'
import Waveform from './Waveform.vue'
import BrandMark from '@/components/graphics/BrandMark.vue'

const call = useCallStore()
const showCaptions = ref(true)
const log = ref<HTMLElement>()

const label = computed(() => {
  if (call.status === 'error') return 'Call unavailable'
  if (call.status === 'idle') return call.notice ? 'Call ended' : ''
  if (call.status === 'ending') return 'Ending call'
  if (call.status === 'reconnecting') return 'Connection lost — reconnecting'
  switch (call.phase) {
    case 'mic': return 'Waiting for microphone'
    case 'connecting': return 'Connecting'
    case 'calling': return 'Calling the concierge'
    case 'ringing': return 'Ringing'
    case 'answered': return 'Concierge picked up'
  }
  if (call.agentState === 'speaking') return 'Concierge is speaking'
  if (call.agentState === 'thinking') return 'Concierge is thinking'
  if (call.agentState === 'listening') return call.muted ? 'You are muted' : 'Listening to you'
  return 'Concierge is joining'
})
// Phases that show animated "typing" dots after the label.
const pending = computed(() => ['mic', 'connecting', 'calling', 'ringing'].includes(call.phase) || call.agentState === 'thinking')
const hint = computed(() => ({
  mic: 'Please allow microphone access in your browser.',
  connecting: 'Opening a secure line…',
  calling: 'Placing your call…',
  ringing: 'Waiting for the concierge to pick up…',
  answered: 'Connected — say hello!',
} as Record<string, string>)[call.phase])
const remaining = computed(() => Math.max(0, call.limit - call.seconds))
const live = computed(() => call.status === 'connected')
const speaker = computed(() => (call.agentState === 'speaking' ? 'agent' : 'user'))

// Setup progress: Connect → Call → Ring → Live.
const steps = ['Connect', 'Call', 'Ring', 'Live'] as const
const stepIndex = computed(() => ({ mic: 0, connecting: 0, calling: 1, ringing: 2, answered: 3, live: 3 } as Record<string, number>)[call.phase] ?? -1)
const settingUp = computed(() => ['mic', 'connecting', 'calling', 'ringing', 'answered'].includes(call.phase))
// Agent avatar ring: rings while calling, glows while the agent speaks.
const avatarState = computed(() =>
  ['calling', 'ringing'].includes(call.phase) ? 'ringing' : call.agentState === 'speaking' && live.value ? 'speaking' : 'idle')

// Escape closes the panel when no call is in progress.
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && call.open && !call.active) call.dismiss() }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// Keep newest caption in view.
watch(() => call.transcript.map((l) => l.text).join('|'), async () => {
  await nextTick()
  log.value?.scrollTo({ top: log.value.scrollHeight })
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-500 ease-out-expo" enter-from-class="translate-y-8 opacity-0"
    leave-active-class="transition duration-700 ease-out" leave-to-class="translate-y-3 opacity-0"
  >
    <section
      v-if="call.open"
      role="dialog" aria-label="Voice call with the HAVEN. concierge"
      class="fixed inset-x-3 bottom-3 z-50 mx-auto w-auto max-w-md rounded-3xl border border-line bg-ink-2/95 p-5 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-sm sm:inset-x-auto sm:right-6 sm:bottom-6 sm:mx-0 sm:w-[24rem]"
    >
      <header class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5" aria-live="polite">
          <span
            class="size-2 rounded-full"
            :class="live ? 'bg-ok' : call.status === 'error' ? 'bg-danger' : 'animate-pulse bg-signal'"
          />
          <span class="text-sm text-paper">{{ label }}<span v-if="pending" class="dots" aria-hidden="true" /></span>
        </div>
        <div class="flex items-center gap-1">
          <span v-if="live || call.status === 'reconnecting'" class="font-mono text-sm tabular-nums text-paper-dim" aria-label="Call duration">
            {{ formatDuration(call.seconds) }}<span class="text-mute"> / {{ formatDuration(call.limit) }}</span>
          </span>
          <button
            v-if="!call.active" class="grid size-11 place-items-center rounded-full text-mute hover:text-paper"
            aria-label="Close call panel" @click="call.dismiss()"
          ><X :size="18" /></button>
        </div>
      </header>

      <!-- Error state -->
      <div v-if="call.status === 'error'" class="mt-4" role="alert">
        <p class="text-sm leading-relaxed text-paper-dim">{{ call.error }}</p>
        <Button class="mt-4" @click="call.start()"><RotateCcw :size="16" aria-hidden="true" />Try again</Button>
      </div>

      <!-- Ended at the demo limit -->
      <div v-else-if="call.status === 'idle'" class="mt-4">
        <p class="text-sm leading-relaxed text-paper-dim">{{ call.notice }}</p>
        <Button class="mt-4" @click="call.start()">Call again</Button>
      </div>

      <template v-else>
        <!-- Agent identity -->
        <div class="mt-5 flex items-center gap-3.5">
          <span class="avatar relative grid size-12 shrink-0 place-items-center rounded-full border border-line bg-ink-3" :data-state="avatarState">
            <BrandMark />
          </span>
          <div class="min-w-0">
            <p class="display text-xl leading-tight">HAVEN. Concierge</p>
            <p class="text-xs text-mute">AI property concierge · 1-minute demo</p>
          </div>
        </div>

        <!-- Setup stepper -->
        <ol v-if="settingUp" class="mt-5 grid grid-cols-4 gap-1.5" aria-label="Call progress">
          <li v-for="(st, i) in steps" :key="st" :aria-current="i === stepIndex ? 'step' : undefined">
            <span class="block h-0.5 rounded-full transition-colors duration-500" :class="i <= stepIndex ? 'bg-signal' : 'bg-line'" />
            <span class="mt-1.5 block text-[0.6875rem] uppercase tracking-widest transition-colors duration-500" :class="i <= stepIndex ? 'text-paper-dim' : 'text-mute/70'">{{ st }}</span>
          </li>
        </ol>

        <div class="mt-4 h-14 text-signal">
          <Waveform :source="speaker" :active="live" :bars="36" :color="speaker === 'agent' ? '#e8a24a' : '#f1ece3'" />
        </div>

        <!-- Live captions -->
        <div
          v-if="showCaptions" ref="log" class="mt-4 max-h-36 space-y-2 overflow-y-auto pr-1 text-sm"
          role="log" aria-live="polite" aria-label="Live transcript"
        >
          <p v-if="!call.transcript.length" class="text-mute">
            {{ hint ?? (live ? 'Say hello — captions appear here.' : 'Setting up a secure line…') }}
          </p>
          <p v-for="l in call.transcript" :key="l.id" :class="l.speaker === 'agent' ? 'text-paper' : 'text-paper-dim'" class="leading-snug">
            <span class="mr-2 text-xs uppercase tracking-widest text-mute">{{ l.speaker === 'agent' ? 'Agent' : 'You' }}</span>
            <span :class="l.final ? '' : 'opacity-70'">{{ l.text }}</span>
          </p>
        </div>

        <div class="mt-4 h-0.5 overflow-hidden rounded bg-line" role="progressbar" aria-label="Demo time remaining" :aria-valuenow="remaining" aria-valuemin="0" :aria-valuemax="call.limit">
          <div class="h-full bg-signal transition-[width] duration-1000 ease-linear" :style="{ width: (remaining / call.limit) * 100 + '%' }" />
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div class="flex gap-2">
            <Button
              variant="outline" size="icon" :disabled="!live" :aria-pressed="call.muted"
              :aria-label="call.muted ? 'Unmute microphone' : 'Mute microphone'" @click="call.toggleMute()"
            >
              <MicOff v-if="call.muted" :size="18" class="text-danger" /><Mic v-else :size="18" />
            </Button>
            <Button
              variant="outline" size="icon" :aria-pressed="showCaptions"
              :aria-label="showCaptions ? 'Hide captions' : 'Show captions'" @click="showCaptions = !showCaptions"
            ><Captions :size="18" /></Button>
          </div>
          <Button variant="danger" @click="call.end()"><PhoneOff :size="16" aria-hidden="true" />End call</Button>
        </div>
      </template>
    </section>
  </Transition>
</template>
