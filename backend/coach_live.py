"""Gemini Live API proxy for Riley coach sessions."""

from __future__ import annotations

import asyncio
import base64
import contextlib
import json
import logging
import os
from typing import Any, Optional

from google import genai
from google.genai import types

from prompts import get_coach_system_prompt

logger = logging.getLogger(__name__)

MODEL = os.environ.get(
    "GEMINI_LIVE_MODEL", "models/gemini-2.5-flash-native-audio-preview-12-2025"
)

_client: Optional[genai.Client] = None


def get_genai_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(
            api_key=api_key,
            http_options={"api_version": "v1beta"},
        )
    return _client


def build_live_config(user_state: dict, username: str) -> types.LiveConnectConfig:
    return types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Zephyr")
            )
        ),
        system_instruction=types.Content(
            parts=[types.Part(text=get_coach_system_prompt(username, user_state))]
        ),
    )


async def _send_json(ws: Any, payload: dict) -> None:
    await ws.send_text(json.dumps(payload))


def _audio_bytes_from_response(response: Any) -> Optional[bytes]:
    data = response.data
    if data and len(data) >= 100:
        return data
    return None


async def _wait_for_client_ready(ws: Any, timeout: float = 60.0) -> None:
    """Wait until the browser has unlocked audio playback and is listening."""
    loop = asyncio.get_event_loop()
    deadline = loop.time() + timeout

    while loop.time() < deadline:
        remaining = deadline - loop.time()
        try:
            raw = await asyncio.wait_for(ws.receive_text(), timeout=remaining)
        except asyncio.TimeoutError:
            raise TimeoutError("Timed out waiting for client_ready") from None

        msg = json.loads(raw)
        if msg.get("type") == "client_ready":
            return
        if msg.get("type") == "close":
            raise asyncio.CancelledError("Client closed before ready")
        if msg.get("type") == "ping":
            await _send_json(ws, {"type": "pong"})
            continue
        # Ignore stray audio frames before handshake completes


async def _pump_client_to_gemini(ws: Any, session: Any, username: str) -> None:
    """Forward browser messages to Gemini Live."""
    from database import append_coach_transcript
    while True:
        raw = await ws.receive_text()
        msg = json.loads(raw)
        msg_type = msg.get("type")

        if msg_type in ("close", "client_ready"):
            if msg_type == "close":
                break
            continue

        if msg_type == "audio":
            data = base64.b64decode(msg["data"])
            if len(data) < 100:
                continue
            logger.debug(f"Forwarding {len(data)} bytes of user audio to Gemini")
            await session.send_realtime_input(
                audio=types.Blob(data=data, mime_type="audio/pcm;rate=16000")
            )
            continue

        if msg_type == "text":
            text = (msg.get("text") or "").strip()
            if not text:
                continue
            # Log the user's text message immediately
            await asyncio.to_thread(append_coach_transcript, username, "user", text)
            await session.send_client_content(
                turns=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=text)],
                    )
                ],
                turn_complete=True,
            )
            continue

        if msg_type == "ping":
            await _send_json(ws, {"type": "pong"})


async def _send_session_greeting(session: Any) -> None:
    await session.send_client_content(
        turns=[
            types.Content(
                role="user",
                parts=[
                    types.Part(
                        text=(
                            "[SESSION_START] The user just opened the coach screen. "
                            "Greet them warmly in one or two sentences and ask how "
                            "they are feeling about their life balance today."
                        )
                    )
                ],
            )
        ],
        turn_complete=True,
    )


async def _relay_gemini_turns(ws: Any, session: Any, username: str) -> None:
    """Consume all model turns until the session ends."""
    user_buf = []
    assistant_buf = []
    from database import append_coach_transcript

    try:
        while True:
            async for response in session.receive():
                server_content = response.server_content
                if server_content:
                    inp = server_content.input_transcription
                    if inp and inp.text:
                        user_buf.append(inp.text)
                        await _send_json(
                            ws,
                            {
                                "type": "transcript",
                                "role": "user",
                                "text": inp.text,
                                "finished": bool(inp.finished),
                            },
                        )
                        if inp.finished:
                            full_text = "".join(user_buf).strip()
                            user_buf = []
                            if full_text:
                                await asyncio.to_thread(append_coach_transcript, username, "user", full_text)

                    out = server_content.output_transcription
                    if out and out.text:
                        assistant_buf.append(out.text)
                        await _send_json(
                            ws,
                            {
                                "type": "transcript",
                                "role": "assistant",
                                "text": out.text,
                                "finished": bool(out.finished),
                            },
                        )
                        if out.finished:
                            full_text = "".join(assistant_buf).strip()
                            assistant_buf = []
                            if full_text:
                                await asyncio.to_thread(append_coach_transcript, username, "assistant", full_text)

                    if server_content.turn_complete:
                        if assistant_buf:
                            full_text = "".join(assistant_buf).strip()
                            assistant_buf = []
                            if full_text:
                                await asyncio.to_thread(append_coach_transcript, username, "assistant", full_text)
                        await _send_json(ws, {"type": "turn_complete"})

                audio = _audio_bytes_from_response(response)
                if audio:
                    await _send_json(
                        ws,
                        {
                            "type": "audio",
                            "data": base64.b64encode(audio).decode("ascii"),
                        },
                    )
    finally:
        # Flush any remaining buffers on cancel / close
        if user_buf:
            full_text = "".join(user_buf).strip()
            if full_text:
                await asyncio.to_thread(append_coach_transcript, username, "user", full_text)
        if assistant_buf:
            full_text = "".join(assistant_buf).strip()
            if full_text:
                await asyncio.to_thread(append_coach_transcript, username, "assistant", full_text)


async def run_coach_live_proxy(ws: Any, username: str, user_state: dict) -> None:
    """Bridge a FastAPI WebSocket to a Gemini Live session."""
    client = get_genai_client()
    config = build_live_config(user_state, username)

    async with client.aio.live.connect(model=MODEL, config=config) as session:
        await _send_json(ws, {"type": "ready", "model": MODEL})

        await _wait_for_client_ready(ws)
        await _send_json(ws, {"type": "session_started"})

        client_task = asyncio.create_task(_pump_client_to_gemini(ws, session, username))
        gemini_task = asyncio.create_task(_relay_gemini_turns(ws, session, username))

        await _send_session_greeting(session)

        done, pending = await asyncio.wait(
            [client_task, gemini_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        for task in done:
            exc = task.exception()
            if exc is not None:
                raise exc
