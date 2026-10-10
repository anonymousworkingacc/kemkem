/**
 * Voice playback for the games.
 *
 * Clips are pre-generated mp3 files under /public (see scripts/gen-voice.py),
 * so every device with a browser audio stack gets the same natural voice.
 * They are decoded once and scheduled back to back with the Web Audio API,
 * so "Chữ bờ" + "Đúng rồi!" sound like one sentence, and no media elements
 * pile up (browsers cap how many may exist and silently drop the rest).
 * Without Web Audio, or if a clip cannot be loaded, the phrase is spoken with
 * the browser's own TTS when it has one; devices without any audio still
 * show the phrase on screen.
 */
export type Clip = { src: string; text: string; lang: "vi-VN" | "en-US" }

type Ctx = AudioContext
const AudioCtx: typeof AudioContext | undefined =
  typeof window === "undefined"
    ? undefined
    : (window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext)

let ctx: Ctx | null = null
const buffers = new Map<string, Promise<AudioBuffer>>()
let sources: AudioBufferSourceNode[] = []
// Audio-clock time at which the last scheduled clip ends.
let endsAt = 0
// Clips are scheduled one sequence at a time, in call order.
let chain: Promise<void> = Promise.resolve()
let pending = 0
// Bumped on every play/stop so an older sequence stops when a newer starts.
let generation = 0

function context(): Ctx | null {
  if (!ctx && AudioCtx) {
    try {
      ctx = new AudioCtx()
    } catch {
      return null
    }
  }
  return ctx
}

// Browsers only start audio after a user gesture: resume on the first touch.
if (typeof window !== "undefined") {
  const unlock = () => {
    const c = context()
    if (c && c.state === "suspended") void c.resume()
  }
  window.addEventListener("pointerdown", unlock, { capture: true })
  window.addEventListener("keydown", unlock, { capture: true })
}

function load(src: string): Promise<AudioBuffer> {
  let buffer = buffers.get(src)
  if (!buffer) {
    const c = context()
    if (!c) return Promise.reject(new Error("No Web Audio"))
    buffer = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Cannot load ${src}`)
        return res.arrayBuffer()
      })
      .then(
        (data) =>
          // Callback form: older WebViews have no promise-returning version.
          new Promise<AudioBuffer>((resolve, reject) =>
            c.decodeAudioData(data, resolve, reject)
          )
      )
    buffer.catch(() => buffers.delete(src))
    buffers.set(src, buffer)
  }
  return buffer
}

/** Downloads and decodes clips so they play without delay. */
export function preload(srcs: string[]) {
  for (const src of srcs) load(src).catch(() => {})
}

export function stop() {
  generation++
  chain = Promise.resolve()
  pending = 0
  for (const source of sources) {
    try {
      source.stop()
    } catch {
      // Not started yet or already stopped.
    }
  }
  sources = []
  endsAt = 0
  if ("speechSynthesis" in window) window.speechSynthesis.cancel()
}

/** True while a clip is playing or waiting to play. */
export function isPlaying() {
  return (
    pending > 0 ||
    (ctx !== null && ctx.currentTime < endsAt) ||
    ("speechSynthesis" in window && window.speechSynthesis.speaking)
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

async function run(clips: Clip[], mine: number) {
  // Fetch every clip of the sequence at once; schedule each as it is ready.
  const loads = clips.map((clip) => load(clip.src).catch(() => null))
  for (const [i, clip] of clips.entries()) {
    const buffer = await loads[i]
    if (mine !== generation) return
    const c = ctx
    if (!buffer || !c) {
      // Let the scheduled audio finish, then fall back to the browser voice.
      if (c) await sleep(Math.max(0, endsAt - c.currentTime) * 1000)
      if (mine !== generation) return
      await speak(clip)
      continue
    }
    if (c.state === "suspended") await c.resume().catch(() => {})
    if (mine !== generation) return
    const source = c.createBufferSource()
    source.buffer = buffer
    source.connect(c.destination)
    const at = Math.max(c.currentTime, endsAt)
    source.start(at)
    endsAt = at + buffer.duration
    sources.push(source)
    source.onended = () => {
      sources = sources.filter((s) => s !== source)
    }
  }
}

/** Plays clips after whatever is already playing or queued. */
export function enqueue(...clips: Clip[]) {
  const mine = generation
  pending++
  chain = chain
    .then(() => run(clips, mine))
    .catch(() => {})
    .finally(() => {
      if (mine === generation) pending--
    })
  return chain
}

/** Plays clips back to back, interrupting whatever was playing before. */
export function play(...clips: Clip[]) {
  stop()
  return enqueue(...clips)
}
