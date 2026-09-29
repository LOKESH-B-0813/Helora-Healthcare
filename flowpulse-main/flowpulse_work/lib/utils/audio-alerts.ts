// ============================================================================
// FlowPulse AI — Synthesized Clinical Audio Alerts & Chime Engine
// Pure Web Audio API harmonic sound generator for token calling and operational alerts.
// ============================================================================

export type ChimeType = 'token-called' | 'success-action' | 'warning-alert' | 'critical-alert'

/**
 * Plays a clean, professional hospital chime using Web Audio API synthesis.
 */
export function playHospitalChime(type: ChimeType = 'token-called'): void {
  if (typeof window === 'undefined') return

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()

    if (type === 'token-called') {
      // 2-tone melodic Ding-Dong chime (E5 -> B4)
      const now = ctx.currentTime
      playTone(ctx, 659.25, now, 0.4, 0.15) // E5
      playTone(ctx, 493.88, now + 0.35, 0.6, 0.18) // B4
    } else if (type === 'success-action') {
      // Pleasant rising triad (C5 -> E5 -> G5)
      const now = ctx.currentTime
      playTone(ctx, 523.25, now, 0.15, 0.1)
      playTone(ctx, 659.25, now + 0.12, 0.15, 0.1)
      playTone(ctx, 783.99, now + 0.24, 0.3, 0.12)
    } else if (type === 'warning-alert') {
      // Double pulsed amber alert
      const now = ctx.currentTime
      playTone(ctx, 440, now, 0.15, 0.2, 'triangle')
      playTone(ctx, 440, now + 0.2, 0.15, 0.2, 'triangle')
    } else if (type === 'critical-alert') {
      // Urgent high-low alert siren
      const now = ctx.currentTime
      playTone(ctx, 880, now, 0.2, 0.25, 'sawtooth')
      playTone(ctx, 660, now + 0.22, 0.2, 0.25, 'sawtooth')
      playTone(ctx, 880, now + 0.44, 0.2, 0.25, 'sawtooth')
    }
  } catch (err) {
    // Non-fatal if audio context blocked by browser autoplay policy
    console.debug('[FlowPulse Audio] Audio playback suppressed:', err)
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number = 0.15,
  waveType: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = waveType
  osc.frequency.setValueAtTime(freq, startTime)

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(startTime)
  osc.stop(startTime + duration)
}
