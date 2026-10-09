/**
 * Voice playback for the games.
 *
 * Clips are pre-generated mp3 files under /public (see scripts/gen-voice.py),
 * so every device with a browser audio stack gets the same natural voice. If
 * a clip cannot be played, the phrase is spoken with the browser's own TTS
 * when it has one; devices without any audio still show the phrase on screen.
 */
export type Clip = { src: string; text: string; lang: "vi-VN" | "en-US" }

const cache = new Map<string, HTMLAudioElement>()
let current: HTMLAudioElement | null = null
// Bumped on every play/stop so an older sequence stops when a newer starts.
let generation = 0

function audioFor(src: string): HTMLAudioElement {
  let audio = cache.get(src)
  if (!audio) {
    audio = new Audio(src)
    audio.preload = "auto"
    cache.set(src, audio)
  }
  return audio
}

/** Starts downloading clips so the first tap answers without delay. */
export function preload(srcs: string[]) {
  for (const src of srcs) audioFor(src)
}

export function stop() {
  generation++
  if (current) {
    current.pause()
    current = null
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel()
}

function playClip(clip: Clip): Promise<void> {
  const audio = audioFor(clip.src)
  current = audio
  audio.currentTime = 0
  return new Promise((resolve, reject) => {
    const done = () => {
      audio.removeEventListener("ended", done)
      audio.removeEventListener("error", fail)
      resolve()
    }
    const fail = () => {
      audio.removeEventListener("ended", done)
      audio.removeEventListener("error", fail)
      reject(new Error(`Cannot play ${clip.src}`))
    }
    audio.addEventListener("ended", done)
    audio.addEventListener("error", fail)
    audio.play().catch(fail)
  })
}

function speak(clip: Clip): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve()
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(clip.text)
    utterance.lang = clip.lang
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

/** Plays clips back to back, interrupting whatever was playing before. */
export async function play(...clips: Clip[]) {
  stop()
  const mine = generation
  for (const clip of clips) {
    if (mine !== generation) return
    try {
      await playClip(clip)
    } catch {
      if (mine !== generation) return
      await speak(clip)
    }
  }
}
