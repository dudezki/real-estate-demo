/** Synthesised ringback tone (440 + 480 Hz double ring) — no audio assets needed. */
export const RING_CYCLE_SECONDS = 2.2 // ring 0.4 · gap 0.2 · ring 0.4 · silence 1.2

export class Ringback {
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | undefined

  /** Create the context inside the click gesture so autoplay policy allows sound. */
  prepare() {
    if (this.ctx) return
    this.ctx = new AudioContext()
    void this.ctx.resume()
  }

  start() {
    const ctx = this.ctx
    if (!ctx || this.gain) return
    this.gain = ctx.createGain()
    this.gain.gain.value = 0
    this.gain.connect(ctx.destination)
    for (const f of [440, 480]) {
      const o = ctx.createOscillator()
      o.frequency.value = f
      o.connect(this.gain)
      o.start()
    }
    const cycle = () => {
      const g = this.gain?.gain
      if (!g) return
      const t = ctx.currentTime
      for (const [on, off] of [[0, 0.4], [0.6, 1.0]]) {
        g.setTargetAtTime(0.07, t + on, 0.015) // soft attack avoids clicks
        g.setTargetAtTime(0, t + off, 0.02)
      }
    }
    cycle()
    this.timer = setInterval(cycle, RING_CYCLE_SECONDS * 1000)
  }

  stop() {
    clearInterval(this.timer)
    this.gain?.gain.cancelScheduledValues(0)
    this.gain?.gain.setTargetAtTime(0, this.ctx?.currentTime ?? 0, 0.03)
    const ctx = this.ctx
    this.gain = null
    this.ctx = null
    setTimeout(() => void ctx?.close(), 200) // let the fade finish
  }
}
