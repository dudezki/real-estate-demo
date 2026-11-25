"""LiveKit voice agent worker.

Run:  uv run python -m agent.worker dev      (local, auto-reload)
      uv run python -m agent.worker start    (production)

STT / LLM / TTS are LiveKit Inference model descriptors, configurable from the environment,
so providers can be swapped without code changes (see README for options and costs).
"""
import asyncio
import logging
import os

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, JobProcess, TurnHandlingOptions, room_io
from livekit.plugins import silero

from app.config import ROOT
from .prompt import FAREWELL, GREETING, SYSTEM_PROMPT

load_dotenv(ROOT / ".env")
log = logging.getLogger("haven.agent")

AGENT_NAME = os.getenv("AGENT_NAME", "estate-agent")
STT_MODEL = os.getenv("STT_MODEL", "deepgram/nova-3")
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4.1-mini")
TTS_MODEL = os.getenv("TTS_MODEL", "cartesia/sonic-3")  # append ":<voice-id>" to pick a voice
MAX_CALL_SECONDS = int(os.getenv("MAX_CALL_SECONDS", "60"))  # hard cap protects free-tier usage
FAREWELL_SECONDS = 4  # reserved at the end of the call for the spoken goodbye

server = agents.AgentServer()


def prewarm(proc: JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name=AGENT_NAME)
async def entrypoint(ctx: JobContext) -> None:
    session = AgentSession(
        stt=STT_MODEL,
        llm=LLM_MODEL,
        tts=TTS_MODEL,
        vad=ctx.proc.userdata["vad"],
        # Barge-in: the caller can interrupt; short pauses are not mistaken for end of turn.
        turn_handling=TurnHandlingOptions(
            endpointing={"min_delay": 0.5},
            interruption={"enabled": True, "mode": "vad"},
        ),
    )

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=SYSTEM_PROMPT),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(),
            text_output=room_io.TextOutputOptions(),  # streams lk.transcription to the UI
        ),
    )

    async def enforce_limit() -> None:
        # The whole call, goodbye included, ends at MAX_CALL_SECONDS.
        await asyncio.sleep(max(1, MAX_CALL_SECONDS - FAREWELL_SECONDS))
        await session.interrupt()
        handle = session.say(FAREWELL, allow_interruptions=False)
        try:
            await asyncio.wait_for(handle.wait_for_playout(), timeout=FAREWELL_SECONDS)
        except asyncio.TimeoutError:
            pass
        ctx.shutdown(reason="max call duration")

    limit_task = asyncio.create_task(enforce_limit())
    ctx.add_shutdown_callback(lambda: limit_task.cancel())

    # Fixed welcome line: spoken immediately, no LLM round trip. It is also added to the chat context.
    session.say(GREETING, allow_interruptions=True)


if __name__ == "__main__":
    agents.cli.run_app(server)
