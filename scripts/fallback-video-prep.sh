#!/usr/bin/env bash
# Prepare for fallback video recording per docs/FALLBACK_VIDEO.md.
# Runs reset + whale-only dry run, then prints recording checklist.
# Usage: ./scripts/fallback-video-prep.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

green() { printf '\033[32m✓ %s\033[0m\n' "$1"; }
info() { printf '→ %s\n' "$1"; }

info "Fallback video prep — reset leads"
pnpm reset:leads
echo ""

info "Pre-flight checks"
./scripts/demo-prep-check.sh
echo ""

info "Whale-only dry run (answer phone when it rings)"
./scripts/dry-run-tier-demo.sh --whale
echo ""

green "System ready for recording"
echo ""
printf '%s\n' \
  "Recording checklist (docs/FALLBACK_VIDEO.md):" \
  "  1. Dashboard tier queue (Sam / Alex / Michael) — 10s" \
  "  2. Whale estimate page → Get my plan — 5s" \
  "  3. Dashboard Michael → calling — 5s" \
  "  4. Live call view — transcript + Moss — 30s" \
  "  5. Phone on speaker — Mac Mini offer — 20s" \
  "  6. Dashboard final status badge — 10s" \
  "  7. Analytics (optional if booked) — 10s" \
  "" \
  "Record: Cmd+Shift+5 (Mac) or QuickTime → New Screen Recording" \
  "Save as: demo-fallback-$(date +%Y-%m-%d).mp4" \
  "Log timestamp in docs/DEMO_DRY_RUN_LOG.md"
