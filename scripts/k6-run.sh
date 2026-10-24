#!/usr/bin/env bash
# Usage: pnpm run k6 <script.js> [k6 run flags...]

set -euo pipefail

SCRIPT="$1"
shift

TESTID="${K6_TESTID:-$(basename "$SCRIPT" .js)-$(date +%Y%m%d-%H%M%S)}"

export K6_PROMETHEUS_RW_SERVER_URL="${K6_PROMETHEUS_RW_SERVER_URL:-http://localhost:9090/api/v1/write}"
# Percentiles can then be computed over any window and across runs, not only
# per flush interval.
export K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
# Ends each series when the run ends; otherwise Prometheus keeps returning the
# last sample for 5 minutes, stretching the run on every panel.
export K6_PROMETHEUS_RW_STALE_MARKERS=true

echo "k6 testid: $TESTID"
exec k6 run -o experimental-prometheus-rw --tag "testid=$TESTID" "$@" "$SCRIPT"
