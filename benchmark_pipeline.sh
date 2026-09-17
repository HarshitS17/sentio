#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# benchmark_pipeline.sh — End-to-end sentiment pipeline latency benchmark
#
# Measures: raw-news → VADER scoring → sentiment-out (Kafka-to-Kafka latency)
#           + sentiment-out → Redis snapshot update (aggregation latency)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NUM_MESSAGES=${1:-50}
TICKER="BENCH"
TOPIC_IN="raw-news"
TOPIC_OUT="sentiment-out"
KAFKA_CONTAINER=$(docker compose ps -q kafka)
RESULTS_FILE="/tmp/sentio_pipeline_results.csv"
CONSUMER_LOG="/tmp/sentio_consumer_output.log"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Sentio Pipeline Latency Benchmark                          ║"
echo "║  Injecting $NUM_MESSAGES synthetic articles into raw-news    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

# Clean up previous results
rm -f "$RESULTS_FILE" "$CONSUMER_LOG"
echo "send_ts_ms,recv_ts_ms,latency_ms" > "$RESULTS_FILE"

# ── 1. Start a background consumer on sentiment-out ──────────────────────
echo "[1/3] Starting background consumer on '$TOPIC_OUT'..."

docker exec "$KAFKA_CONTAINER" kafka-console-consumer \
  --bootstrap-server localhost:29092 \
  --topic "$TOPIC_OUT" \
  --group "benchmark-consumer-$$" \
  --property print.timestamp=true \
  --timeout-ms 60000 \
  > "$CONSUMER_LOG" 2>/dev/null &
CONSUMER_PID=$!

# Give consumer a moment to join the group
sleep 3

# ── 2. Produce synthetic messages with timestamps ────────────────────────
echo "[2/3] Producing $NUM_MESSAGES synthetic articles to '$TOPIC_IN'..."

declare -a SEND_TIMES

for i in $(seq 1 $NUM_MESSAGES); do
  SEND_TS=$(python3 -c "import time; print(int(time.time()*1000))")
  TITLE="BENCH_${SEND_TS} Synthetic headline number $i for benchmark testing"

  # Build a valid NewsArticle JSON
  MSG=$(cat <<EOF
{"title":"${TITLE}","description":"Benchmark test article ${i}","publishedAt":"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)","sourceUrl":"https://benchmark.test/article-${SEND_TS}-${i}"}
EOF
)

  # Produce to Kafka using the docker kafka container
  echo "$MSG" | docker exec -i "$KAFKA_CONTAINER" kafka-console-producer \
    --bootstrap-server localhost:29092 \
    --topic "$TOPIC_IN" \
    --property "parse.key=true" \
    --property "key.separator=|" \
    2>/dev/null <<< "${TICKER}|${MSG}"

  SEND_TIMES[$i]=$SEND_TS

  # Small delay to avoid overwhelming (1 msg per 100ms = 10 msg/s)
  sleep 0.1
done

echo "    All $NUM_MESSAGES messages sent."

# ── 3. Wait for processing, then analyze results ────────────────────────
echo "[3/3] Waiting for pipeline processing (30s timeout)..."
sleep 15

# Kill the consumer gracefully
kill $CONSUMER_PID 2>/dev/null || true
wait $CONSUMER_PID 2>/dev/null || true

# ── 4. Parse consumer output and compute latencies ──────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PIPELINE LATENCY RESULTS"
echo "═══════════════════════════════════════════════════════════════"

LATENCIES=()
MATCHED=0

while IFS= read -r line; do
  # Extract the BENCH_ timestamp from the consumed message
  if echo "$line" | grep -q "BENCH_"; then
    RECV_TS=$(python3 -c "import time; print(int(time.time()*1000))")
    BENCH_TS=$(echo "$line" | grep -oP 'BENCH_\K[0-9]+' | head -1)

    if [ -n "$BENCH_TS" ]; then
      LATENCY=$((RECV_TS - BENCH_TS))
      # Filter out clearly wrong latencies (negative or >60s)
      if [ "$LATENCY" -gt 0 ] && [ "$LATENCY" -lt 60000 ]; then
        LATENCIES+=("$LATENCY")
        MATCHED=$((MATCHED + 1))
        echo "$BENCH_TS,$RECV_TS,$LATENCY" >> "$RESULTS_FILE"
      fi
    fi
  fi
done < "$CONSUMER_LOG"

if [ ${#LATENCIES[@]} -eq 0 ]; then
  echo "  ⚠ No messages matched. Attempting alternative measurement..."
  echo ""

  # Alternative: measure using direct Kafka timestamps
  # Produce a batch and use timing from send to consumer output
  echo "  Using producer-to-consumer timing instead..."

  # Run a tighter measurement: produce one message and time the consumer
  LATENCIES=()
  for i in $(seq 1 20); do
    SEND_TS=$(python3 -c "import time; print(int(time.time()*1000))")
    TITLE="BENCH2_${SEND_TS} Quick benchmark headline $i"
    MSG="{\"title\":\"${TITLE}\",\"description\":\"Quick bench ${i}\",\"publishedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"sourceUrl\":\"https://bench.test/q-${SEND_TS}\"}"

    echo "${TICKER}|${MSG}" | docker exec -i "$KAFKA_CONTAINER" kafka-console-producer \
      --bootstrap-server localhost:29092 \
      --topic "$TOPIC_IN" \
      --property "parse.key=true" \
      --property "key.separator=|" 2>/dev/null

    # Poll sentiment-out for this specific message
    RESULT=$(timeout 10 docker exec "$KAFKA_CONTAINER" kafka-console-consumer \
      --bootstrap-server localhost:29092 \
      --topic "$TOPIC_OUT" \
      --group "bench-tight-$$-$i" \
      --max-messages 1 \
      --timeout-ms 10000 2>/dev/null || echo "")

    RECV_TS=$(python3 -c "import time; print(int(time.time()*1000))")

    if [ -n "$RESULT" ]; then
      LATENCY=$((RECV_TS - SEND_TS))
      if [ "$LATENCY" -gt 0 ] && [ "$LATENCY" -lt 30000 ]; then
        LATENCIES+=("$LATENCY")
        echo "    Message $i: ${LATENCY}ms"
      fi
    fi
  done
fi

if [ ${#LATENCIES[@]} -gt 0 ]; then
  # Compute stats using python
  python3 - "${LATENCIES[@]}" <<'PYEOF'
import sys
import statistics

latencies = sorted([int(x) for x in sys.argv[1:]])
n = len(latencies)
avg = statistics.mean(latencies)
median = statistics.median(latencies)
p95_idx = int(n * 0.95)
p95 = latencies[min(p95_idx, n-1)]
p99_idx = int(n * 0.99)
p99 = latencies[min(p99_idx, n-1)]
mn = min(latencies)
mx = max(latencies)

print(f"")
print(f"  Messages processed:  {n}")
print(f"  Min latency:         {mn}ms")
print(f"  Average latency:     {avg:.1f}ms")
print(f"  Median latency:      {median:.1f}ms")
print(f"  P95 latency:         {p95}ms")
print(f"  P99 latency:         {p99}ms")
print(f"  Max latency:         {mx}ms")
print(f"")
print(f"  RESUME METRICS:")
print(f"  ├─ Average: {avg:.0f}ms")
print(f"  └─ P95:     {p95}ms")
PYEOF
else
  echo "  ✗ Could not measure pipeline latency."
  echo "    Check that the app is running and processing messages."
fi

echo "═══════════════════════════════════════════════════════════════"

# ── 5. Check Redis for aggregated snapshot ──────────────────────────────
echo ""
echo "Checking Redis for aggregated snapshot..."
SNAPSHOT=$(docker exec $(docker compose ps -q redis) redis-cli GET "snapshot:BENCH" 2>/dev/null || echo "")
if [ -n "$SNAPSHOT" ] && [ "$SNAPSHOT" != "(nil)" ]; then
  echo "  ✓ Redis snapshot found for BENCH ticker"
  echo "  $SNAPSHOT" | python3 -c "
import sys, json
try:
  data = json.loads(sys.stdin.read().strip())
  print(f'  ├─ Rolling Average: {data.get(\"rollingAverage\", \"N/A\")}')
  print(f'  ├─ Trend: {data.get(\"trend\", \"N/A\")}')
  print(f'  ├─ Sample Count: {data.get(\"sampleCount\", \"N/A\")}')
  print(f'  └─ Generated At: {data.get(\"generatedAt\", \"N/A\")}')
except: print('  (Could not parse snapshot JSON)')
"
else
  echo "  ⚠ No snapshot in Redis for BENCH ticker (may need more time or messages)"
fi

echo ""
echo "Done. Raw results saved to: $RESULTS_FILE"
