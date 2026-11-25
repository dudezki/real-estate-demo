# HAVEN. Estates — The Alba Residence (AI voice concierge + scroll tour)

Vue 3 + Vite + Tailwind v4 frontend, FastAPI token service, and a LiveKit Agents worker.
**Author:** Lucky John Faderon, AI Solutions Architect.

Real-estate variant of the CONNECT. contact-center demo. A fictional listing page with:
- **Scroll tour** (`web/src/components/tour/HouseTour.vue`): pinned, scrubbed GSAP timeline over an illustrated SVG
  house: gate opens → façade parts labelled → camera pushes through the front door → interior rooms labelled.
  Narrow screens show labels as chips; reduced-motion users get a static, labelled version.
- **Blueprint** (`BlueprintSection.vue`): ground-floor plan that draws itself on scroll.
- **Voice concierge**: LiveKit agent `estate-agent` with listing facts in `backend/agent/prompt.py`; it never quotes a price.

> The "Deployment (live)" section below is inherited from CONNECT. and does **not** describe this project yet:
> this project has no Vercel site or LiveKit Cloud agent of its own. Dev server: http://localhost:5299.


The hero CTA opens a floating call dock and connects the visitor to an AI agent over WebRTC.

```
Browser (Vue) ──POST /api/token──► FastAPI ──signs JWT (secret stays here)
     │                                         (room-scoped, 10 min, mic-only, agent dispatch)
     └──WebRTC──► LiveKit Cloud ◄──── Agent worker (STT → LLM → TTS via LiveKit Inference)
```

## Status — read this first
- **Verified:** frontend build, desktop + mobile rendering, mic-blocked error path, token API (5 pytest tests +
  a live uvicorn smoke test with dummy keys), agent module import.
- **NOT verified:** a live voice conversation. No LiveKit credentials were available while building, so the
  WebRTC connection, agent dispatch, audio, interruptions and live transcription have **not** been exercised.
  See "Verify a live call" below. Treat M5/M6 as built-but-unproven until you do.
- **Placeholder:** the hero uses a procedural SVG backdrop. Add a licensed photo at `web/public/images/hero.jpg`
  and it layers on automatically (e.g. Unsplash/Pexels, check the licence). Contact email is a placeholder.

## Setup
Requires Node ≥ 20, `uv`, Python 3.12/3.13 (livekit-agents does not yet support 3.14 in this project's config).

```bash
cp .env.example .env        # fill LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET
cd web && npm install
cd ../backend && uv sync --python 3.13
```

Run three processes:

```bash
# 1. API (port 8000)
cd backend && uv run uvicorn app.main:create_app --factory --reload --port 8000
# 2. Agent worker
cd backend && uv run python -m agent.worker download-files   # first run only: fetch VAD/turn models
cd backend && uv run python -m agent.worker dev
# 3. Web (port 5199, proxies /api to :8000)
cd web && npm run dev
```

### Verify a live call
1. Open http://localhost:5199 and press **Start a conversation**; allow the microphone.
2. Expect: "Connecting" → "Agent is joining" → greeting audio, captions, waveform reacting.
3. Check: mute, interrupt the agent mid-sentence, end call, kill the API mid-call (reconnect state).
4. Agent logs show the job dispatched; if no agent joins, check the worker is registered under `AGENT_NAME`.

## Deployment (live)
- **Site + token API:** https://contact-center-demo-beta.vercel.app — Vercel serves `web/dist` and runs
  `api/index.py` (FastAPI from `backend/app`, deps in root `requirements.txt`) as a Python function; `/api/*`
  is rewritten to it (same origin). Config: `vercel.json`, `.vercelignore`. Env vars live in the Vercel dashboard.
- **Agent:** LiveKit Cloud agent `CA_EFmxcqtWfwVu`, region `ap-south`, built from `backend/Dockerfile`
  (`backend/livekit.toml`). Redeploy: `cd backend && lk agent deploy`. Logs: `lk agent logs`.
- Redeploy web/API: `vercel deploy --prod`.
- Known limit: the token rate limiter is in-memory per serverless instance, so limits are per instance,
  not global. The 60-second call cap is enforced by the agent regardless. Move to Redis/Upstash for strict limits.

## Security
- API secret/key only in `.env` (git-ignored); the browser receives a JWT only.
- Token: unique room + identity per call, `roomJoin` for that room only, microphone-only publishing, no data
  publishing, 10-minute TTL, `Cache-Control: no-store`; secrets and tokens are never logged.
- Rate limiting: per-IP (5/min) and global (60/min) sliding windows, in memory — **single process only**; use
  Redis if you scale out. `TRUST_PROXY_HEADERS` must stay `false` unless behind a proxy you control.
- CORS restricted to `ALLOWED_ORIGINS`. Agent enforces `MAX_CALL_SECONDS` (default 60).

## Costs and limits (verify current pricing on livekit.io/pricing)
STT/LLM/TTS default to LiveKit Inference descriptors (`deepgram/nova-3`, `openai/gpt-4.1-mini`,
`cartesia/sonic-3`), billed through your LiveKit Cloud plan; the free tier has limited included usage and
concurrent sessions, after which usage is charged. Set `MAX_CALL_SECONDS` and rate limits conservatively.
Swap providers via `STT_MODEL` / `LLM_MODEL` / `TTS_MODEL` (any LiveKit Inference model string), or replace
the strings in `backend/agent/worker.py` with provider plugin instances using your own provider keys.

## Layout
```
web/src/components/{ui,layout,sections,graphics,voice}   web/src/stores/call.ts (LiveKit + state)
backend/app      FastAPI (config, tokens, ratelimit, main)
backend/agent    LiveKit worker + system prompt
design-system/   MASTER.md      PROGRESS.md   milestone tracker
```

## Testing results (what was run)
| Check | Result |
|---|---|
| `uv run pytest` | 5 passed (scoped JWT, per-call rooms, rate limit, window expiry, CORS) |
| `npm run build` (vue-tsc + vite) | passes; entry JS 274 kB (102 kB gzip), livekit-client lazy 154 kB gzip |
| Browser (built-in pane) 800px & 375px | renders; no horizontal overflow; no console errors |
| Mic denied → error + retry | works (pane blocks mic) |
| Live LiveKit call | **not run** (no credentials) |
| Lighthouse / screen-reader / real-device audio | not run |

## Future expansion (not implemented)
Seams: per-call agent selection via `agent_name` + room metadata (multi-agent, multi-tenant); prompt in
`agent/prompt.py` (prompt management); transcripts already stream over `lk.transcription` (persist server-side);
`RoomOptions`/dispatch rules accommodate SIP; tools can be added to `Agent` for CRM/RAG/escalation.
