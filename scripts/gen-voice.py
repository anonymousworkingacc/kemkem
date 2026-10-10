"""Generate the games' voice clips: Vietnamese and English.

Usage (CPU is enough, ~1–3 s per clip):
    python3 -m venv .venv-tts && .venv-tts/bin/pip install vieneu kokoro-onnx soundfile
    .venv-tts/bin/python scripts/gen-voice.py [--force]
Needs ffmpeg on PATH. If onnxruntime fails with "External data path escapes
model directory", pin it: .venv-tts/bin/pip install onnxruntime==1.22.1

Voices (both Apache-2.0, fine for commercial use):
  vi  VieNeu-TTS v3 Turbo (https://github.com/pnnbao97/VieNeu-TTS), preset
      "Trúc Ly": female, Northern (Hà Nội) accent.
  en  Kokoro-82M via kokoro-onnx (https://github.com/thewh1teagle/kokoro-onnx),
      voice "af_heart": female, American English. The model files are
      downloaded to ~/.cache/kokoro on first use.

Writes into public/<dir>/:
  - the phrase packs src/components/kid/letter-hunt/phrases.<lang>.json
    (correct-1.mp3, wrong-1.mp3, …)
  - for every config in src/features/*/voice.json (one, or a list):
      prompt-<n>-<id>.mp3  each prompt of that language's pack, read whole
                           per letter ("Bạn hãy tìm chữ bờ." / "Find the
                           letter B.")
      letter-<id>.mp3      the letter on its own, said when a tile is tapped
                           ("Chữ bờ." / "Letter B.")
    Whole sentences sound far more natural than a lone syllable glued on.
Existing files are skipped unless --force is given. The Vietnamese model
samples differently on each run: listen to short clips and regenerate any
that come out unclear (delete the file and run again).
"""

import json
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKS = ROOT / "src/components/kid/letter-hunt"
KOKORO_DIR = Path.home() / ".cache/kokoro"
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def jobs():
    packs = {}
    for path in sorted(PACKS.glob("phrases.*.json")):
        pack = load(path)
        packs[pack["lang"]] = pack
        for group in ("correct", "wrong", "complete"):
            for p in pack[group]:
                yield pack["lang"], pack["dir"], p["id"], p["text"]
    for config_path in sorted(ROOT.glob("src/features/*/voice.json")):
        data = load(config_path)
        for config in data if isinstance(data, list) else [data]:
            yield from letter_jobs(config, packs[config["lang"]]["prompt"])


def letter_jobs(config, prompts):
    lang, out_dir, noun = config["lang"], config["dir"], config["noun"]
    for letter in config["letters"]:
        for p in prompts:
            text = f"{p['text']} {noun} {letter['say']}."
            yield lang, out_dir, f"{p['id']}-{letter['id']}", text
        text = f"{noun.capitalize()} {letter['say']}."
        yield lang, out_dir, f"letter-{letter['id']}", text


def vietnamese():
    from vieneu import Vieneu

    tts = Vieneu()
    return lambda text, wav: tts.save(tts.infer(text, voice="Trúc Ly"), str(wav))


def english():
    import soundfile
    from kokoro_onnx import Kokoro

    KOKORO_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        if not (KOKORO_DIR / name).exists():
            urllib.request.urlretrieve(KOKORO_URL + name, KOKORO_DIR / name)
    tts = Kokoro(str(KOKORO_DIR / "kokoro-v1.0.onnx"), str(KOKORO_DIR / "voices-v1.0.bin"))

    def speak(text, wav):
        # Slightly slower than normal speech for small children.
        samples, rate = tts.create(text, voice="af_heart", speed=0.9, lang="en-us")
        soundfile.write(str(wav), samples, rate)

    return speak


ENGINES = {"vi": vietnamese, "en": english}

# Trim silence at both ends (keeping a 30 ms edge) so clips played back to
# back sound like one sentence. Trúc Ly speaks quickly: slow her down a bit
# (atempo keeps the pitch).
TRIM = (
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
    "areverse,"
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
    "areverse"
)
FILTERS = {"vi": f"atempo=0.88,{TRIM}", "en": TRIM}


def main(force: bool) -> None:
    todo = [
        (lang, ROOT / "public" / out_dir / f"{clip_id}.mp3", text)
        for lang, out_dir, clip_id, text in jobs()
    ]
    todo = [job for job in todo if force or not job[1].exists()]
    engines = {}  # loaded lazily: each takes a while to start
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "clip.wav"
        for lang, out, text in todo:
            if lang not in engines:
                engines[lang] = ENGINES[lang]()
            out.parent.mkdir(parents=True, exist_ok=True)
            engines[lang](text, wav)
            # Small mono mp3s: e-readers download them on the fly.
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-af", FILTERS[lang],
                 "-ac", "1", "-ar", "24000", "-b:a", "48k", str(out)],
                check=True,
            )
            print(f"{out.relative_to(ROOT)}  <- {text!r}", flush=True)


if __name__ == "__main__":
    main("--force" in sys.argv)
