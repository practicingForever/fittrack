// Web Audio API beeps + SpeechSynthesis announcements.
// Audio is unlocked by the "Start WOD" button tap (required on iOS).

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // Resume if suspended (iOS after lock screen)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function beep(freq: number, durationMs: number, gainVal = 0.4, startDelay = 0) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = ac.currentTime + startDelay
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000)
    osc.start(t)
    osc.stop(t + durationMs / 1000 + 0.05)
  } catch {
    // silently fail if audio unavailable
  }
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  // Cancel any in-progress utterance so cues don't queue up
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 1.1
  u.pitch = 1.0
  u.volume = 0.9
  window.speechSynthesis.speak(u)
}

// ─── Named cues ───────────────────────────────────────────────────────────────

/** Single mid beep — generic alert */
export function cueAlert() {
  beep(880, 150)
}

/** Countdown beeps: 3-2-1 spaced 1 second apart */
export function cueCountdown() {
  beep(660, 120, 0.35, 0)
  beep(660, 120, 0.35, 1)
  beep(880, 200, 0.5,  2)
}

/** Double beep — 10s warning */
export function cueWarning10() {
  beep(770, 100, 0.4, 0)
  beep(770, 100, 0.4, 0.18)
  speak('10 seconds')
}

/** Single beep + voice — 30s warning */
export function cueWarning30() {
  beep(660, 150)
  speak('30 seconds')
}

/** Ascending two-tone + voice — round/work start */
export function cueRoundStart(roundLabel?: string) {
  beep(660, 120, 0.4, 0)
  beep(880, 180, 0.5, 0.15)
  if (roundLabel) speak(roundLabel)
}

/** Descending two-tone + voice — rest start */
export function cueRestStart() {
  beep(880, 120, 0.4, 0)
  beep(660, 180, 0.5, 0.15)
  speak('Rest')
}

/** Three ascending notes — WOD complete */
export function cueComplete() {
  beep(660, 150, 0.5, 0)
  beep(880, 150, 0.5, 0.2)
  beep(1100, 300, 0.6, 0.4)
  speak('WOD complete')
}

// ─── Mute toggle (persisted) ─────────────────────────────────────────────────

const MUTE_KEY = 'wod_audio_muted'

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true'
}

export function setMuted(val: boolean) {
  localStorage.setItem(MUTE_KEY, String(val))
}

// Wrap every cue export so callers don't need to check mute themselves
function guarded(fn: (...args: unknown[]) => void) {
  return (...args: unknown[]) => { if (!isMuted()) fn(...args) }
}

export const playAlert      = guarded(cueAlert)
export const playCountdown  = guarded(cueCountdown)
export const playWarning10  = guarded(cueWarning10)
export const playWarning30  = guarded(cueWarning30)
export const playRoundStart = guarded((label?: unknown) => cueRoundStart(label as string | undefined))
export const playRestStart  = guarded(cueRestStart)
export const playComplete   = guarded(cueComplete)
