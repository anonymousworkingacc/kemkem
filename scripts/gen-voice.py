"""Generate the games' voice clips with Microsoft Edge neural TTS.

Usage:  pip install edge-tts && python3 scripts/gen-voice.py [--force]

Writes into public/<dir>/:
  - the shared phrases in src/components/kid/letter-hunt/phrases.json
    (correct-1.mp3, wrong-1.mp3, …)
  - for every src/features/*/voice.json (one config, or a list of them):
      prompt-<n>-<id>.mp3  each prompt read whole per letter
                           ("Bạn hãy tìm chữ bờ.")
      letter-<id>.mp3      the letter on its own, said when a tile is tapped
                           ("Chữ bờ.")
    Whole sentences sound far more natural than a lone syllable glued on.
Existing files are skipped unless --force is given. Set SSL_CERT_FILE when
running behind a TLS-inspecting proxy.
"""

import asyncio
import json
import os
import ssl
import sys
from pathlib import Path

import edge_tts.communicate as tts

ROOT = Path(__file__).resolve().parent.parent
PHRASES = ROOT / "src/components/kid/letter-hunt/phrases.json"

if os.environ.get("SSL_CERT_FILE"):
    tts._SSL_CTX = ssl.create_default_context(cafile=os.environ["SSL_CERT_FILE"])


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def jobs():
    phrases = load(PHRASES)
    for group in ("correct", "wrong", "complete"):
        for p in phrases[group]:
            yield phrases["dir"], p["id"], p["text"], phrases["voice"], "-5%"
    for config_path in sorted(ROOT.glob("src/features/*/voice.json")):
        data = load(config_path)
        for config in data if isinstance(data, list) else [data]:
            yield from letter_jobs(config, phrases["prompt"])


def letter_jobs(config, prompts):
    voice, rate = config["voice"], config.get("rate", "+0%")
    noun = config["noun"]  # "chữ" or "số"
    for letter in config["letters"]:
        for p in prompts:
            text = f"{p['text']} {noun} {letter['say']}."
            yield config["dir"], f"{p['id']}-{letter['id']}", text, voice, rate
        text = f"{noun.capitalize()} {letter['say']}."
        yield config["dir"], f"letter-{letter['id']}", text, voice, rate


async def main(force: bool) -> None:
    for out_dir, clip_id, text, voice, rate in jobs():
        out = ROOT / "public" / out_dir / f"{clip_id}.mp3"
        if out.exists() and not force:
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        await tts.Communicate(text, voice, rate=rate).save(str(out))
        print(f"{out.relative_to(ROOT)}  <- {text!r} ({voice})")


if __name__ == "__main__":
    asyncio.run(main("--force" in sys.argv))
