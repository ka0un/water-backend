#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Water Quality Load Test Runner
#  Usage:  ./run.sh [test] [scenario] [options]
#
#  Tests:
#    submission   — public user water test submission flow
#    moderator    — moderator dashboard actions and logs
#    combined     — both workloads running concurrently
#
#  Scenarios (for submission / moderator):
#    smoke        — 3–5 VUs × 1 min (quick sanity)
#    load         — ramp to 30–50 VUs × 5 min (default)
#    stress       — ramp to 80–150 VUs × 5 min
#    spike        — instant 200 VUs (submission only)
#
#  Examples:
#    ./run.sh                              # combined load
#    ./run.sh submission smoke             # quick smoke test
#    ./run.sh moderator stress             # stress moderator
#    ./run.sh submission load --out json=results/run.json
#
#  Env overrides:
#    BASE_URL      default: http://localhost:3000/api/v1
#    MOD_EMAIL     default: mod@example.com
#    MOD_PASSWORD  default: Password123!
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TEST="${1:-combined}"
SCENARIO="${2:-load}"
shift 2 2>/dev/null || true   # consume first 2 args; remaining go to k6

BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
MOD_EMAIL="${MOD_EMAIL:-mod@example.com}"
MOD_PASSWORD="${MOD_PASSWORD:-Password123!}"

# ── Ensure k6 is installed ────────────────────────────────────────
if ! command -v k6 &>/dev/null; then
  echo "❌  k6 is not installed."
  echo ""
  echo "  Install options:"
  echo "    macOS  : brew install k6"
  echo "    Linux  : sudo snap install k6"
  echo "             or: https://dl.k6.io/rpm/k6.repo"
  echo "    Docker : docker run --rm -i grafana/k6 run -"
  echo "    Windows: choco install k6 / winget install k6"
  echo ""
  echo "  Full guide: https://grafana.com/docs/k6/latest/set-up/install-k6/"
  exit 1
fi

echo "─────────────────────────────────────────────────────"
echo "  Water Quality Load Tests"
echo "─────────────────────────────────────────────────────"
echo "  Test      : $TEST"
echo "  Scenario  : $SCENARIO"
echo "  Target    : $BASE_URL"
echo "─────────────────────────────────────────────────────"
echo ""

mkdir -p "$SCRIPT_DIR/results"

case "$TEST" in
  submission)
    k6 run \
      -e BASE_URL="$BASE_URL" \
      -e SCENARIO="$SCENARIO" \
      "$@" \
      "$SCRIPT_DIR/scripts/water-submission.js"
    ;;

  moderator)
    k6 run \
      -e BASE_URL="$BASE_URL" \
      -e SCENARIO="$SCENARIO" \
      -e MOD_EMAIL="$MOD_EMAIL" \
      -e MOD_PASSWORD="$MOD_PASSWORD" \
      "$@" \
      "$SCRIPT_DIR/scripts/moderator-actions.js"
    ;;

  combined)
    k6 run \
      -e BASE_URL="$BASE_URL" \
      -e MOD_EMAIL="$MOD_EMAIL" \
      -e MOD_PASSWORD="$MOD_PASSWORD" \
      "$@" \
      "$SCRIPT_DIR/scripts/combined.js"
    ;;

  *)
    echo "Unknown test: '$TEST'. Use: submission | moderator | combined"
    exit 1
    ;;
esac

echo ""
echo "✓ Results written to $SCRIPT_DIR/results/"
