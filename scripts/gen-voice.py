"""Generate the games' voice clips with Microsoft Edge neural TTS.

Usage:  pip install edge-tts && python3 scripts/gen-voice.py [--force]

Writes into public/<dir>/:
  - the shared phrases in src/components/kid/letter-hunt/phrases.json
    (prompt-1.mp3, correct-1.mp3, …)
  - for every src/features/*/voice.json, either the letter names
    (letter-<id>.mp3, joined to the prompt at play time), or with
    "fullPrompt": true each prompt read whole per letter
    (prompt-<n>-<id>.mp3: "Bạn hãy tìm chữ bờ"), which sounds more natural
    than a lone syllable when prompt and letter share a language
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
    for group in ("prompt", "correct", "wrong", "complete"):
        for p in phrases[group]:
            # Vietnamese sentences at a calm pace.
            yield phrases["dir"], p["id"], p["text"], phrases["voice"], "-5%"
    for config_path in sorted(ROOT.glob("src/features/*/voice.json")):
        config = load(config_path)
        if config.get("fullPrompt"):
            for p in phrases["prompt"]:
                for letter in config["letters"]:
                    yield (
                        config["dir"],
                        f"{p['id']}-{letter['id']}",
                        f"{p['text']} {letter['say']}.",
                        config["voice"],
                        config.get("rate", "+0%"),
                    )
            continue
        for letter in config["letters"]:
            yield (
                config["dir"],
                f"letter-{letter['id']}",
                letter["say"],
                config["voice"],
                config.get("rate", "+0%"),
            )


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
