"""Generate the game's voice clips with Microsoft Edge neural TTS.

Usage:  pip install edge-tts && python3 scripts/gen-voice.py [--force]

Reads src/features/alphabet/voice.json and writes one mp3 per phrase plus one
per English letter name (letter-a.mp3 … letter-z.mp3) into public/<dir>/.
Existing files are skipped unless --force is given. Set SSL_CERT_FILE when
running behind a TLS-inspecting proxy.
"""

import asyncio
import json
import os
import ssl
import string
import sys
from pathlib import Path

import edge_tts.communicate as tts

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "src/features/alphabet/voice.json"

if os.environ.get("SSL_CERT_FILE"):
    tts._SSL_CTX = ssl.create_default_context(cafile=os.environ["SSL_CERT_FILE"])


async def main(force: bool) -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    out_dir = ROOT / "public" / config["dir"]
    out_dir.mkdir(parents=True, exist_ok=True)

    jobs = [
        (p["id"], p["text"], config["voices"]["vi"])
        for group in ("prompt", "correct", "wrong", "complete")
        for p in config[group]
    ]
    jobs += [
        (f"letter-{c}", c.upper(), config["voices"]["en"])
        for c in string.ascii_lowercase
    ]

    for clip_id, text, voice in jobs:
        out = out_dir / f"{clip_id}.mp3"
        if out.exists() and not force:
            continue
        # Letter names are read slowly and clearly; Vietnamese at a calm pace.
        rate = "-20%" if clip_id.startswith("letter-") else "-5%"
        await tts.Communicate(text, voice, rate=rate).save(str(out))
        print(f"{out.relative_to(ROOT)}  <- {text!r} ({voice})")


if __name__ == "__main__":
    asyncio.run(main("--force" in sys.argv))
