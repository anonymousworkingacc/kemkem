"""Generate the games' voice clips with VieNeu-TTS (Northern Vietnamese voice).

Usage (CPU is enough, ~3 s per clip):
    python3 -m venv .venv-tts && .venv-tts/bin/pip install vieneu
    .venv-tts/bin/python scripts/gen-voice.py [--force]
Needs ffmpeg on PATH. If onnxruntime fails with "External data path escapes
model directory", pin it: .venv-tts/bin/pip install onnxruntime==1.22.1

VieNeu-TTS v3 Turbo (Apache-2.0, https://github.com/pnnbao97/VieNeu-TTS) with
the preset "Ngọc Huyền": female, Northern (Hà Nội) accent. One voice for every
clip in every game.

Writes into public/<dir>/:
  - the shared phrases in src/components/kid/letter-hunt/phrases.json
    (correct-1.mp3, wrong-1.mp3, …)
  - for every src/features/*/voice.json (one config, or a list of them):
      prompt-<n>-<id>.mp3  each prompt read whole per letter
                           ("Bạn hãy tìm chữ bờ.")
      letter-<id>.mp3      the letter on its own, said when a tile is tapped
                           ("Chữ bờ.")
    Whole sentences sound far more natural than a lone syllable glued on.
Existing files are skipped unless --force is given.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHRASES = ROOT / "src/components/kid/letter-hunt/phrases.json"
VOICE = "Ngọc Huyền"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def jobs():
    phrases = load(PHRASES)
    for group in ("correct", "wrong", "complete"):
        for p in phrases[group]:
            yield phrases["dir"], p["id"], p["text"]
    for config_path in sorted(ROOT.glob("src/features/*/voice.json")):
        data = load(config_path)
        for config in data if isinstance(data, list) else [data]:
            yield from letter_jobs(config, phrases["prompt"])


def letter_jobs(config, prompts):
    noun = config["noun"]  # "chữ" or "số"
    for letter in config["letters"]:
        for p in prompts:
            text = f"{p['text']} {noun} {letter['say']}."
            yield config["dir"], f"{p['id']}-{letter['id']}", text
        yield config["dir"], f"letter-{letter['id']}", f"{noun.capitalize()} {letter['say']}."


def main(force: bool) -> None:
    todo = [
        (ROOT / "public" / out_dir / f"{clip_id}.mp3", text)
        for out_dir, clip_id, text in jobs()
    ]
    todo = [(out, text) for out, text in todo if force or not out.exists()]
    if not todo:
        return
    from vieneu import Vieneu  # slow import, only when there is work

    tts = Vieneu()
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "clip.wav"
        for out, text in todo:
            out.parent.mkdir(parents=True, exist_ok=True)
            tts.save(tts.infer(text, voice=VOICE), str(wav))
            # Small mono mp3s: e-readers download them on the fly.
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ac", "1",
                 "-ar", "24000", "-b:a", "48k", str(out)],
                check=True,
            )
            print(f"{out.relative_to(ROOT)}  <- {text!r}", flush=True)


if __name__ == "__main__":
    main("--force" in sys.argv)
