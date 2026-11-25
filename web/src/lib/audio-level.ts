/** Wraps a MediaStreamTrack in an AnalyserNode so the UI can draw audio-reactive waveforms. */
export class LevelMeter {
  private ctx: AudioContext
  private analyser: AnalyserNode
  private src: MediaStreamAudioSourceNode
  private buf: Uint8Array<ArrayBuffer>

  constructor(track: MediaStreamTrack) {
    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.78
    this.src = this.ctx.createMediaStreamSource(new MediaStream([track]))
    this.src.connect(this.analyser) // not connected to destination: no double playback
    this.buf = new Uint8Array(this.analyser.frequencyBinCount)
  }

  /** Returns `bars` values in 0..1 (voice-range bins only). */
  read(bars: number): number[] {
    this.analyser.getByteFrequencyData(this.buf)
    const usable = Math.floor(this.buf.length * 0.6)
    const step = usable / bars
    const out: number[] = []
    for (let i = 0; i < bars; i++) {
      let sum = 0
      const from = Math.floor(i * step)
      const to = Math.max(from + 1, Math.floor((i + 1) * step))
      for (let j = from; j < to; j++) sum += this.buf[j]
      out.push(Math.min(1, sum / (to - from) / 200))
    }
    return out
  }

  close() {
    this.src.disconnect()
    void this.ctx.close()
  }
}
