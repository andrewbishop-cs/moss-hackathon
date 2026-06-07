# Fallback Video — Record After First Clean Dry Run

Record once you have **one clean whale PSTN run** (phone rang, agent spoke, transcript visible). Target: hour 14–16 of the hackathon.

## What to capture (~90 seconds)

1. **Dashboard** — tier queue (Sam / Alex / Michael) — 10s
2. **Whale estimate page** → Get my plan — 5s
3. **Dashboard** — Michael flips to `calling` — 5s
4. **Live call view** — transcript + Moss panel during call — 30s
5. **Phone on speaker** — agent Mac Mini + senior AE offer (if possible) — 20s
6. **Dashboard** — final status badge after hangup — 10s
7. **Analytics** (optional) — if status is `booked` — 10s

## Recording setup

- **Mac:** QuickTime → File → New Screen Recording, or `Cmd+Shift+5`
- Capture **entire screen** or the browser window + phone on desk
- Enable microphone if narrating live; otherwise record silent and voice-over later
- 1080p minimum; keep under 100MB for easy sharing

## Before recording

- [ ] Reset leads: `uv --directory backend run python -m src.reset`
- [ ] Three terminals running (backend, agent, frontend)
- [ ] iPhone DND off, ringer on
- [ ] Close unrelated tabs/notifications

## After recording

- [ ] Save as `demo-fallback-YYYY-MM-DD.mp4` in a known location (Desktop or repo `docs/` if small)
- [ ] Test playback on phone (judges may ask to see it on a second device)
- [ ] Note timestamp of clean take in [DEMO_DRY_RUN_LOG.md](DEMO_DRY_RUN_LOG.md)

## When to use fallback

| Situation | Action |
|-----------|--------|
| PSTN fails during judge demo | Play video while narrating: "Here's the same flow from our dry run" |
| Bad wifi | Pre-load video locally; don't rely on cloud upload |
| Agent worker crash | Video + dashboard live view (transcript may still work on retry) |

## Narration overlay (optional, 15s)

> "PLG company loses a whale lead who found nineteen million in savings. Our AI calls back in under a second, qualifies on spend, and scales the offer — Mac Mini and a senior AE for Cursor-scale accounts. Built on LiveKit SIP and Moss real-time context."
