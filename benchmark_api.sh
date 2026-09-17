#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# benchmark_api.sh — REST API response time benchmark for Sentio
#
# Hits each endpoint 100 times and reports avg/p95 response times.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NUM_REQUESTS=${1:-100}
BASE_URL="http://localhost:8080"
RESULTS_DIR="/tmp/sentio_api_bench"
TICKER="AAPL"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Sentio REST API Response Time Benchmark                    ║"
echo "║  $NUM_REQUESTS requests per endpoint                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

mkdir -p "$RESULTS_DIR"

# ── Helper function ──────────────────────────────────────────────────────
benchmark_endpoint() {
  local NAME="$1"
  local URL="$2"
  local OUTFILE="$RESULTS_DIR/${NAME}.csv"

  echo ""
  echo "─── Benchmarking: $NAME ───"
  echo "    URL: $URL"
  echo "    Requests: $NUM_REQUESTS"

  # Warm up with 3 requests
  for i in 1 2 3; do
    curl -s -o /dev/null "$URL" 2>/dev/null || true
  done

  # Collect response times
  echo "time_ms,http_code,size_bytes" > "$OUTFILE"
  local ERRORS=0

  for i in $(seq 1 $NUM_REQUESTS); do
    RESULT=$(curl -s -o /dev/null -w "%{time_total},%{http_code},%{size_download}" "$URL" 2>/dev/null || echo "0,0,0")
    TIME_SEC=$(echo "$RESULT" | cut -d',' -f1)
    HTTP_CODE=$(echo "$RESULT" | cut -d',' -f2)
    SIZE=$(echo "$RESULT" | cut -d',' -f3)

    # Convert seconds to milliseconds
    TIME_MS=$(python3 -c "print(f'{float(\"$TIME_SEC\")*1000:.2f}')")
    echo "$TIME_MS,$HTTP_CODE,$SIZE" >> "$OUTFILE"

    if [ "$HTTP_CODE" != "200" ]; then
      ERRORS=$((ERRORS + 1))
    fi

    # Progress indicator every 25 requests
    if [ $((i % 25)) -eq 0 ]; then
      echo "    Progress: $i/$NUM_REQUESTS"
    fi
  done

  # Compute stats
  python3 - "$OUTFILE" "$NAME" "$ERRORS" <<'PYEOF'
import sys, csv, statistics

filepath = sys.argv[1]
name = sys.argv[2]
errors = int(sys.argv[3])

times = []
with open(filepath) as f:
    reader = csv.DictReader(f)
    for row in reader:
        t = float(row['time_ms'])
        if t > 0:
            times.append(t)

if not times:
    print(f"    ✗ No successful requests for {name}")
    sys.exit(0)

times.sort()
n = len(times)
avg = statistics.mean(times)
median = statistics.median(times)
p95 = times[int(n * 0.95)] if n > 1 else times[0]
p99 = times[int(n * 0.99)] if n > 1 else times[0]
mn = min(times)
mx = max(times)

print(f"")
print(f"    Results ({n} successful, {errors} errors):")
print(f"    ├─ Min:     {mn:.2f}ms")
print(f"    ├─ Average: {avg:.2f}ms")
print(f"    ├─ Median:  {median:.2f}ms")
print(f"    ├─ P95:     {p95:.2f}ms")
print(f"    ├─ P99:     {p99:.2f}ms")
print(f"    └─ Max:     {mx:.2f}ms")
PYEOF
}

# ── Verify app is running ────────────────────────────────────────────────
echo ""
echo "Checking if Sentio is running on $BASE_URL..."
HTTP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sentiment/summary" 2>/dev/null || echo "000")
if [ "$HTTP_CHECK" = "000" ]; then
  echo "  ✗ Cannot reach Sentio at $BASE_URL"
  echo "    Make sure the app is running: ./mvnw spring-boot:run"
  exit 1
fi
echo "  ✓ Sentio is reachable (HTTP $HTTP_CHECK)"

# ── Run benchmarks ───────────────────────────────────────────────────────
benchmark_endpoint "sentiment_summary"   "$BASE_URL/api/sentiment/summary"
benchmark_endpoint "sentiment_snapshot"  "$BASE_URL/api/sentiment/snapshot/$TICKER"
benchmark_endpoint "price_ticker"        "$BASE_URL/api/price/$TICKER"
benchmark_endpoint "price_full"          "$BASE_URL/api/price/full/$TICKER"

# ── Summary table ────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SUMMARY TABLE — REST API Response Times"
echo "═══════════════════════════════════════════════════════════════"
echo ""

python3 - "$RESULTS_DIR" <<'PYEOF'
import csv, statistics, os, sys

results_dir = sys.argv[1]
endpoints = [
    ("sentiment_summary",  "/api/sentiment/summary"),
    ("sentiment_snapshot", "/api/sentiment/snapshot/AAPL"),
    ("price_ticker",       "/api/price/AAPL"),
    ("price_full",         "/api/price/full/AAPL"),
]

print(f"  {'Endpoint':<35} {'Avg(ms)':>10} {'P95(ms)':>10} {'P99(ms)':>10}")
print(f"  {'─'*35} {'─'*10} {'─'*10} {'─'*10}")

for name, path in endpoints:
    filepath = os.path.join(results_dir, f"{name}.csv")
    if not os.path.exists(filepath):
        print(f"  {path:<35} {'N/A':>10} {'N/A':>10} {'N/A':>10}")
        continue

    times = []
    with open(filepath) as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = float(row['time_ms'])
            if t > 0:
                times.append(t)

    if not times:
        print(f"  {path:<35} {'N/A':>10} {'N/A':>10} {'N/A':>10}")
        continue

    times.sort()
    n = len(times)
    avg = statistics.mean(times)
    p95 = times[int(n * 0.95)] if n > 1 else times[0]
    p99 = times[int(n * 0.99)] if n > 1 else times[0]

    print(f"  {path:<35} {avg:>9.2f}  {p95:>9.2f}  {p99:>9.2f}")

print()
PYEOF

echo "Raw results saved to: $RESULTS_DIR/"
echo "Done."
