#!/usr/bin/env bash
# Run 3 automated pitch-rehearsal prep cycles (reset + whale dispatch each).
# Paul still needs to speak through DEMO_SCRIPT.md with phone answered.
# Usage: ./scripts/pitch-rehearsal-batch.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for run in 1 2 3; do
  printf '\n========== Rehearsal prep run %s/3 ==========\n' "$run"
  pnpm reset:leads
  ./scripts/demo-prep-check.sh
  ./scripts/dry-run-tier-demo.sh --whale
  PITCH_RUN="$run" ./scripts/pitch-rehearsal.sh --auto
  printf 'Run %s dispatch complete — log spoken timing in docs/PITCH_REHEARSAL_LOG.md\n' "$run"
  if [[ "$run" -lt 3 ]]; then
    sleep 5
    pnpm reset:leads
  fi
done

printf '\nAll 3 automated prep cycles complete.\n'
printf 'Next: answer phone during one live run, then record fallback video.\n'
