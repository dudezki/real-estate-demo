import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { Room, RemoteTrack, RemoteParticipant } from 'livekit-client'
import { ApiError, requestToken } from '@/services/api'
import { LevelMeter } from '@/lib/audio-level'
import { Ringback, RING_CYCLE_SECONDS } from '@/lib/ringback'

export type CallPhase = 'idle' | 'mic' | 'connecting' | 'calling' | 'ringing' | 'answered' | 'live'
export type CallStatus = 'idle' | 'requesting-mic' | 'connecting' | 'connected' | 'reconnecting' | 'ending' | 'error'
export type AgentState = 'initializing' | 'listening' | 'thinking' | 'speaking' | 'idle'
export interface TranscriptLine { id: string; speaker: 'agent' | 'user'; text: string; final: boolean }

/** User-facing messages for the failures we can name. */
function describeError(e: unknown): string {
  if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError'))
    return 'Microphone access was blocked. Allow the microphone in your browser settings, then try again.'
  if (e instanceof DOMException && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError'))
    return 'No microphone was found. Connect one and try again.'
  if (e instanceof ApiError) {
    if (e.status === 429) return `Too many call attempts. Please wait${e.retryAfter ? ` ${e.retryAfter}s` : ' a moment'} and try again.`
    return e.message
  }
  return e instanceof Error ? e.message : 'Something went wrong connecting the call.'
}

export const useCallStore = defineStore('call', () => {
  const status = ref<CallStatus>('idle')
  const agentState = ref<AgentState>('initializing')
  const muted = ref(false)
  const seconds = ref(0)
  const error = ref<string | null>(null)
  const transcript = ref<TranscriptLine[]>([])
  const notice = ref<string | null>(null)
  const limit = Number(import.meta.env.VITE_CALL_LIMIT_SECONDS ?? 60)
  const ringing = ref(false)
  const phase = ref<CallPhase>('idle')
  const open = ref(false) // dock visibility (also true while in a call)
  const room = shallowRef<Room | null>(null)

  let timer: ReturnType<typeof setInterval> | undefined
  let userMeter: LevelMeter | null = null
  let agentMeter: LevelMeter | null = null
  let audioEls: HTMLMediaElement[] = []
  let attempt: AbortController | null = null
  let ring = new Ringback()

  function stopRinging() { ring.stop(); ringing.value = false }
  // livekit-client is ~600 kB: load it only when a call starts so the landing page stays light.
  let lk: typeof import('livekit-client')

  const active = computed(() => ['connecting', 'connected', 'reconnecting', 'requesting-mic'].includes(status.value))

  /** Live levels for the waveform canvas; non-reactive on purpose (read every frame). */
  const levels = (who: 'user' | 'agent', bars: number) => (who === 'user' ? userMeter : agentMeter)?.read(bars) ?? new Array(bars).fill(0)

  function reset() {
    stopRinging()
    phase.value = 'idle'
    clearInterval(timer)
    userMeter?.close(); agentMeter?.close()
    userMeter = agentMeter = null
    audioEls.forEach((el) => el.remove())
    audioEls = []
    seconds.value = 0
    muted.value = false
    agentState.value = 'initializing'
  }

  function upsert(line: TranscriptLine) {
    const i = transcript.value.findIndex((l) => l.id === line.id)
    if (i >= 0) transcript.value[i] = line
    else transcript.value.push(line)
  }

  function wire(r: Room) {
    const { ParticipantKind, RoomEvent, Track } = lk
    r.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
      if (track.kind !== Track.Kind.Audio) return
      const el = track.attach() // plays the agent's audio
      el.style.display = 'none'
      document.body.appendChild(el)
      audioEls.push(el)
      if (p.kind === ParticipantKind.AGENT) {
        agentMeter = new LevelMeter(track.mediaStreamTrack)
        stopRinging()
        phase.value = 'answered' // "Agent picked up" beat, then normal live states
        setTimeout(() => { if (phase.value === 'answered') phase.value = 'live' }, 1600)
      }
    })
    r.on(RoomEvent.LocalTrackPublished, (pub) => {
      if (pub.track?.kind === Track.Kind.Audio) userMeter = new LevelMeter(pub.track.mediaStreamTrack)
    })
    // The agent publishes its state as a participant attribute.
    const readAgentState = () => {
      const agent = [...r.remoteParticipants.values()].find((p) => p.kind === ParticipantKind.AGENT)
      const s = agent?.attributes['lk.agent.state'] as AgentState | undefined
      if (s) agentState.value = s
    }
    r.on(RoomEvent.ParticipantAttributesChanged, readAgentState)
    r.on(RoomEvent.ParticipantConnected, readAgentState)
    r.on(RoomEvent.Reconnecting, () => { status.value = 'reconnecting' })
    r.on(RoomEvent.Reconnected, () => { status.value = 'connected' })
    r.on(RoomEvent.Disconnected, () => {
      if (status.value !== 'ending' && status.value !== 'idle') {
        if (seconds.value >= limit - 4) {
          // The agent ended the call at the demo time limit: a normal ending, not a failure.
          notice.value = `Demo limit reached (1 minute). Thanks for touring with HAVEN.`
          status.value = 'idle'
          // Let the message be read, then fade the panel away.
          setTimeout(() => { if (status.value === 'idle') open.value = false }, 3500)
        } else {
          error.value = 'The call was disconnected.'
          status.value = 'error'
        }
      }
      reset()
    })
    // Live transcription arrives on a text stream topic.
    r.registerTextStreamHandler('lk.transcription', async (reader, info) => {
      const attrs = reader.info.attributes ?? {}
      const speaker = info.identity === r.localParticipant.identity ? 'user' : 'agent'
      const id = attrs['lk.segment_id'] ?? reader.info.id
      let text = ''
      for await (const chunk of reader) {
        // Agent text streams in deltas; user STT chunks are the full hypothesis so far.
        text = speaker === 'agent' ? text + chunk : chunk
        upsert({ id, speaker, text, final: false })
      }
      upsert({ id, speaker, text, final: true })
    })
  }

  async function start() {
    if (active.value) return
    error.value = null
    notice.value = null
    transcript.value = []
    open.value = true
    attempt = new AbortController()
    ring = new Ringback()
    ring.prepare() // inside the click gesture so the browser allows audio
    try {
      status.value = 'requesting-mic'
      phase.value = 'mic'
      // Probe permission first so we can show a precise message before consuming a token.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
      probe.getTracks().forEach((t) => t.stop())

      status.value = 'connecting'
      phase.value = 'connecting'
      await new Promise((r) => setTimeout(r, 900)) // a short "Connecting…" beat before the phone rings
      if (attempt.signal.aborted) return
      ring.start(); ringing.value = true
      phase.value = 'calling'
      // Ring for at least one full cycle so it feels like placing a call, while the token loads in parallel.
      const [{ token, url }, mod] = await Promise.all([
        requestToken(attempt.signal),
        import('livekit-client'),
        new Promise((r) => setTimeout(r, RING_CYCLE_SECONDS * 1000)),
      ])
      lk = mod
      const r = new lk.Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      room.value = r
      wire(r)
      await r.connect(url, token)
      if (phase.value === 'calling') phase.value = 'ringing'
      await r.startAudio() // satisfies autoplay policy; we are inside a user gesture chain
      await r.localParticipant.setMicrophoneEnabled(true)
      if (r.state !== lk.ConnectionState.Connected) throw new Error('Could not establish the call.')
      status.value = 'connected'
      timer = setInterval(() => { seconds.value++ }, 1000)
    } catch (e) {
      if (attempt?.signal.aborted) return
      error.value = describeError(e)
      status.value = 'error'
      await room.value?.disconnect().catch(() => {})
      room.value = null
      reset()
    }
  }

  async function end() {
    attempt?.abort()
    status.value = 'ending'
    await room.value?.disconnect().catch(() => {})
    room.value = null
    reset()
    status.value = 'idle'
    open.value = false // user ended the call: fade the panel out
  }

  async function toggleMute() {
    const r = room.value
    if (!r) return
    muted.value = !muted.value
    await r.localParticipant.setMicrophoneEnabled(!muted.value)
  }

  async function dismiss() {
    if (active.value) return
    open.value = false
    status.value = 'idle'
    error.value = null
  }

  return { phase, ringing, notice, limit, status, agentState, muted, seconds, error, transcript, open, active, levels, start, end, toggleMute, dismiss }
})
