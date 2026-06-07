#!/usr/bin/env bash
# Guided pitch rehearsal — opens demo URLs and prints DEMO_SCRIPT.md cues.
# Usage:
#   ./scripts/pitch-rehearsal.sh           # full ~2:00 run
#   ./scripts/pitch-rehearsal.sh --tight   # ~1:15 whale-only variant

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TIGHT=""
AUTO=""
for arg in "$@"; do
  case "$arg" in
    --tight) TIGHT="--tight" ;;
    --auto) AUTO=1 ;;
  esac
done
RUN_NUM="${PITCH_RUN:-1}"

SMB_ESTIMATE="$FRONTEND_URL/pump/estimate?lead_id=b1000000-0016-0000-0000-000000000016"
WHALE_ESTIMATE="$FRONTEND_URL/pump/estimate?lead_id=b1000000-0001-0000-0000-000000000001"
SMB_LIVE="$FRONTEND_URL/dashboard/calls/b1000000-0016-0000-0000-000000000016"
WHALE_LIVE="$FRONTEND_URL/dashboard/calls/b1000000-0001-0000-0000-000000000001"
DASHBOARD="$FRONTEND_URL/dashboard"
ANALYTICS="$FRONTEND_URL/dashboard/analytics"

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
cue() { printf '  → %s\n' "$1"; }
wait_key() {
  if [[ -n "$AUTO" ]]; then
    sleep 1
  else
    printf '\n[Press Enter to continue] '; read -r _
  fi
}

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" 2>/dev/null || true
  fi
  cue "$url"
}

printf 'Pitch rehearsal run #%s\n' "$RUN_NUM"
printf 'Log results in docs/PITCH_REHEARSAL_LOG.md after each run.\n'

if [[ "$TIGHT" == "--tight" ]]; then
  say "TIGHT-TIME VARIANT (~1:15)"
  cue "Problem (12s): PLG companies lose ninety percent of visitors… Nobody calls them."
  wait_key
  say "Tier queue (15s)"
  open_url "$DASHBOARD"
  cue "Sam not qualified · Alex SMB DoorDash · Michael whale Mac Mini — one breath"
  wait_key
  say "Whale call only (45s)"
  open_url "$WHALE_ESTIMATE"
  cue "Get my plan → dashboard → live view → answer phone"
  open_url "$WHALE_LIVE"
  cue "Mac Mini + senior AE · Real PSTN over LiveKit SIP"
  wait_key
  say "UC1 gesture (5s)"
  open_url "$DASHBOARD"
  cue "Point at Sam: new signup, under threshold — agent exits gracefully"
  wait_key
  say "Why + sponsors (18s)"
  cue "Voice AI is finally good enough… LiveKit for telephony, Moss for live context."
else
  say "FULL RUN (~2:00)"
  cue "Problem (0:00–0:15): PLG companies lose ninety percent… Nobody calls them."
  wait_key
  say "Tier queue (0:15–0:25)"
  open_url "$DASHBOARD"
  cue "Sam not qualified · Alex SMB DoorDash · Michael whale Mac Mini"
  wait_key
  say "UC2 Call 1 — SMB Alex (0:25–0:50)"
  open_url "$SMB_ESTIMATE"
  cue "Get my plan → dashboard calling → live view"
  open_url "$SMB_LIVE"
  cue 'DoorDash credit · ~$33K/yr savings hook'
  wait_key
  say "Between calls"
  cue "Same agent, different tier."
  cue "Reset if stuck: pnpm reset:leads"
  wait_key
  say "UC2 Call 2 — Whale Michael (0:50–1:25) HERO"
  open_url "$WHALE_ESTIMATE"
  cue "Get my plan → answer on speaker"
  open_url "$WHALE_LIVE"
  cue "Mac Mini + senior AE · Real PSTN over LiveKit SIP"
  wait_key
  say "UC1 beat (1:25–1:30)"
  open_url "$DASHBOARD"
  cue "Gesture at Sam — social-proof hook, walks away under 5K"
  wait_key
  say "Why voice AI (1:30–1:45)"
  cue "Voice AI is finally good enough to qualify and book without a 20-person SDR team"
  wait_key
  say "Sponsors (1:45–2:00)"
  cue "LiveKit — SIP telephony, inference, real-time rooms"
  cue "Moss — sub-10ms semantic search for playbook + lead context"
  open_url "$ANALYTICS"
fi

printf '\nRun #%s complete. Log timing + issues in docs/PITCH_REHEARSAL_LOG.md\n' "$RUN_NUM"
