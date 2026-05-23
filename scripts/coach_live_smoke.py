#!/usr/bin/env python3
"""Smoke test: Gemini Live API + Hayat system instruction (no microphone)."""

import asyncio
import os
import sys

from google import genai
from google.genai import types

MODEL = os.environ.get(
    "GEMINI_LIVE_MODEL", "models/gemini-2.5-flash-native-audio-preview-12-2025"
)

HAYAT_INSTRUCTION = """You are Hayat, MindHack's AI life coach. Be warm and concise.
The user's Wheel scores: Health 6/10, Career 7/10. Greet them and ask one check-in question."""


async def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Set GEMINI_API_KEY in .env or environment", file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        output_audio_transcription=types.AudioTranscriptionConfig(),
        system_instruction=types.Content(parts=[types.Part(text=HAYAT_INSTRUCTION)]),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Zephyr")
            )
        ),
    )

    async with client.aio.live.connect(model=MODEL, config=config) as session:
        await session.send_client_content(
            turns=[
                types.Content(
                    role="user",
                    parts=[types.Part(text="Start the coaching session with a brief greeting.")],
                )
            ],
            turn_complete=True,
        )

        audio_bytes = 0
        transcript = ""
        turn = session.receive()
        async for msg in turn:
            if msg.data:
                audio_bytes += len(msg.data)
            sc = msg.server_content
            if sc and sc.output_transcription and sc.output_transcription.text:
                transcript = sc.output_transcription.text

        print(f"Model: {MODEL}")
        print(f"Audio received: {audio_bytes} bytes")
        print(f"Transcript: {transcript or '(none)'}")

        if audio_bytes < 1000:
            print("WARN: very little audio — check model access / billing", file=sys.stderr)
            sys.exit(2)

        print("OK: Hayat Live smoke test passed")


if __name__ == "__main__":
    asyncio.run(main())
