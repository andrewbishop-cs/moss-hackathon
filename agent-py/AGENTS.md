# AGENTS.md

Guide for coding agents working on **Alex** — Pump's outbound voice sales agent built with [LiveKit Agents](https://docs.livekit.io/agents/) and [Moss](https://docs.moss.dev/docs). See @README.md for general LiveKit setup and @docs/ARCHITECTURE.md for the full system diagram.

## What this agent does

**Alex** is an AI customer success manager at Pump who makes outbound PLG sales calls. Two use cases share the same persona and tools but differ in the opening hook:

| Use case | ID | Hook |
|----------|-----|------|
| New signup, no estimate | `uc1_new_signup` | Social proof + ask monthly spend to qualify |
| Estimate completed, no trial | `uc2_estimate_completed` | Lead with their annual savings number, then tier offer |

The backend dispatches jobs with metadata `{ lead_id, use_case, phone_number? }`. When `phone_number` is present, the agent dials out via a LiveKit SIP trunk; otherwise it runs in-room/console mode. Registered agent name is `agent-py` — do not rename.

## Project structure

This Python project uses the `uv` package manager. Always use `uv` to install dependencies, run the agent, and run tests.

All app-level code is in `src/`. `agent.py` is the entrypoint (see the Dockerfile). Supporting modules:

- `call_signals.py` — rule-based booking signal detection; injects coaching hints mid-call
- `transcript_store.py` — captures turns and persists transcripts on shutdown
- `create_index.py` — rebuilds Moss indexes from JSON seed files

Format with ruff: `uv run ruff format` and `uv run ruff check`.

## Moss semantic search

[Moss](https://docs.moss.dev/docs) backs RAG over Pump product facts and per-lead context. The agent talks to Moss through `MossClient`, authenticated with `MOSS_PROJECT_ID` / `MOSS_PROJECT_KEY` (see `.env.example`). STT/LLM/TTS run on LiveKit Inference — Moss credentials are the main non-LiveKit secrets.

### Indexes

Two Moss indexes (names overridable via `MOSS_INDEX_NAME` / `MOSS_LEADS_INDEX_NAME`):

- **`knowledge`** — static RAG corpus. Read-only at runtime; seeded from `knowledge.json`.
- **`leads`** — one document per lead, tagged with `lead_id` metadata. Read-only at runtime; seeded from `leads.json` for local dev. In production the backend indexes each lead from Supabase before dispatch.

`src/create_index.py` builds both indexes. Run from the repo root via `pnpm moss:index` once Moss credentials are set. Re-run after any change to `knowledge.json` or `leads.json`.

### Tools

The `Assistant` (in `src/agent.py`) exposes four `@function_tool()` methods:

- **`get_lead_context()`** — queries the `leads` index filtered to the current `lead_id`. Normally preloaded into the system prompt in `on_enter`; use as a fallback mid-call.
- **`search_knowledge(query)`** — queries the `knowledge` index (RAG), returns joined snippet text, and publishes a `moss_context` data message to the room for the frontend context panel.
- **`book_meeting(when, tier)`** — records a booked demo via `POST {BACKEND_URL}/calls/outcome` with status `booked`.
- **`log_outcome(outcome, notes)`** — records the call disposition via the same backend endpoint. Valid outcomes: `booked`, `interested`, `callback`, `declined`, `no_answer`, `disqualified`, `bad_data`, `reengage_90d`. Auto-hangup on `no_answer` and `declined`.

`lead_id` and `use_case` are parsed from `ctx.job.metadata` (dispatched by the backend), falling back to defaults for `console` mode. When you change tool behavior, follow the TDD guidance below and update `tests/test_moss.py`, which stubs `MossClient` for deterministic unit tests.

## System prompt and script sync

Call flow, guardrails, and tool-usage rules live in `_instructions_for()` and `_opening_for()` in `src/agent.py`. These must stay aligned with `docs/AGENT_SCRIPT.md` — the agent source explicitly references that doc.

Speakable product facts, objection lines, and phase-specific scripts live in `knowledge.json` and are retrieved at runtime via `search_knowledge`. When changing script wording, update **both** the system prompt (for control-plane rules) and `knowledge.json` (for RAG content), then re-index.

Do not duplicate the entire call flow in both places. System prompt = control plane; knowledge = content plane.

## Coaching loop (sales behavior)

Paul + ChatGPT own sales coaching; Cursor implements promoted rules.

| Doc | Purpose |
|-----|---------|
| [docs/COACHING_LOG.md](../docs/COACHING_LOG.md) | Raw call observations |
| [docs/BEHAVIORAL_PRINCIPLES.md](../docs/BEHAVIORAL_PRINCIPLES.md) | Canonical behavior rules |
| [docs/IMPLEMENTATION_BACKLOG.md](../docs/IMPLEMENTATION_BACKLOG.md) | Tickets → code/prompt/kb/tests |

Behavioral anchors in `knowledge.json` use ids `kb-behavior-*`. Always-on rules (voicemail, tier privacy, wolf persistence, DNC exit, talk-over yield, active listening) live in `agent.py`. Signal detection and coaching hints live in `call_signals.py`.

## Backend integration

The agent does not write to Supabase directly. Outcomes and transcripts go through the FastAPI hub:

- `POST {BACKEND_URL}/calls/outcome` — `book_meeting` and `log_outcome` (see `docs/LEAD_DISPOSITIONS.md` for the 7-category framework)
- Transcript upload on session shutdown via `transcript_store.py`

Set `BACKEND_URL` in `.env.local` (default `http://localhost:8000`).

## Outbound telephony

When dispatch metadata includes `phone_number`, the agent dials via `SIP_OUTBOUND_TRUNK_ID` using `create_sip_participant`. On voicemail or answering machine, the agent stays silent, calls `log_outcome("no_answer")`, and hangs up — never leaves a message.

## Call signals and transcripts

`call_signals.py` classifies prospect utterances (weak agreement, positive curiosity, strong intent) and injects a `# Booking coaching (this turn)` block into the system prompt dynamically. Update `tests/test_call_signals.py` when changing signal phrases.

`transcript_store.py` records each turn (with signal tags for lead utterances) and persists locally plus to the backend on shutdown.

## Environment variables

Key vars in `.env.example`:

- `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`, `MOSS_INDEX_NAME`, `MOSS_LEADS_INDEX_NAME`
- `BACKEND_URL`
- `SIP_OUTBOUND_TRUNK_ID` (outbound calls)
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

## Testing

Run tests with `uv run pytest` from `agent-py/`.

| File | What it covers |
|------|----------------|
| `tests/test_moss.py` | Moss tools (`search_knowledge`, `get_lead_context`, `book_meeting`, `log_outcome`) — deterministic unit tests |
| `tests/test_call_signals.py` | Booking signal classification and coaching hints |
| `tests/test_agent.py` | LLM-judged behavioral evals (disclosure, grounding, guardrails) |

When modifying core agent behavior — instructions, tool descriptions, call flow — use test-driven development. Write tests for the desired behavior first, then iterate until they pass. For new tools, add cases to `test_moss.py`. For prompt/script changes, add or update evals in `test_agent.py`.

## LiveKit reference

LiveKit Agents docs evolve quickly. Use the [LiveKit CLI](https://docs.livekit.io/intro/basics/cli/) (`lk docs`, requires v2.15.0+) or the [docs MCP server](https://docs.livekit.io/reference/developer-tools/docs-mcp/) at `https://docs.livekit.io/mcp` to browse current APIs. The CLI also manages SIP trunks and other infrastructure — run `lk --help` to explore.

Install CLI: macOS `brew install livekit-cli`, Linux `curl -sSL https://get.livekit.io/cli | bash`, Windows `winget install LiveKit.LiveKitCLI`.
