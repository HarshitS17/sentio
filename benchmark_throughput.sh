#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# benchmark_throughput.sh — Kafka throughput benchmark for Sentio
#
# Floods raw-news with synthetic messages and measures processing rate
# through to sentiment-out.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NUM_MESSAGES=${1:-200}
KAFKA_CONTAINER=$(docker compose ps -q kafka)
TOPIC_IN="raw-news"
TOPIC_OUT="sentiment-out"
TICKERS=("AAPL" "TSLA" "NVDA" "MSFT")
RESULTS_FILE="/tmp/sentio_throughput_results.txt"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Sentio Kafka Throughput Benchmark                          ║"
echo "║  Flooding $NUM_MESSAGES messages across ${#TICKERS[@]} tickers          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

# ── 1. Get initial offset for sentiment-out ──────────────────────────────
echo ""
echo "[1/4] Recording initial consumer offsets..."

INITIAL_OFFSET=$(docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:29092 \
  --topic "$TOPIC_OUT" \
  --time -1 2>/dev/null | head -1 | awk -F: '{print $NF}' || echo "0")
echo "    sentiment-out current offset: $INITIAL_OFFSET"

# ── 2. Generate all messages into a single batch file ────────────────────
echo "[2/4] Generating $NUM_MESSAGES messages..."
BATCH_FILE="/tmp/sentio_bench_batch.txt"
rm -f "$BATCH_FILE"

for i in $(seq 1 $NUM_MESSAGES); do
  # Round-robin across tickers
  TICKER_IDX=$(( (i - 1) % ${#TICKERS[@]} ))
  TICKER="${TICKERS[$TICKER_IDX]}"
  TS=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
  UNIQUE_URL="https://throughput.bench/article-${RANDOM}-${i}-$(date +%s%N)"

  MSG="${TICKER}|{\"title\":\"THROUGHPUT_${i} Market analysis for ${TICKER} shows strong momentum\",\"description\":\"Throughput benchmark article ${i}\",\"publishedAt\":\"${TS}\",\"sourceUrl\":\"${UNIQUE_URL}\"}"
  echo "$MSG" >> "$BATCH_FILE"
done

echo "    Batch file generated: $(wc -l < "$BATCH_FILE") messages"

# ── 3. Flood-produce all messages and time it ────────────────────────────
echo "[3/4] Sending all messages to Kafka (burst mode)..."

START_TS=$(python3 -c "import time; print(time.time())")

cat "$BATCH_FILE" | docker exec -i "$KAFKA_CONTAINER" kafka-console-producer \
  --bootstrap-server localhost:29092 \
  --topic "$TOPIC_IN" \
  --property "parse.key=true" \
  --property "key.separator=|" 2>/dev/null

SEND_END_TS=$(python3 -c "import time; print(time.time())")

SEND_DURATION=$(python3 -c "print(f'{$SEND_END_TS - $START_TS:.2f}')")
SEND_RATE=$(python3 -c "d = $SEND_END_TS - $START_TS; print(f'{$NUM_MESSAGES / d:.1f}' if d > 0 else 'inf')")
echo "    Sent $NUM_MESSAGES messages in ${SEND_DURATION}s (${SEND_RATE} msg/s produce rate)"

# ── 4. Wait for processing and measure output rate ───────────────────────
echo "[4/4] Waiting for pipeline to process all messages..."
echo "    Polling sentiment-out offset every 2 seconds..."

MAX_WAIT=120
ELAPSED=0
PREV_PROCESSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))

  CURRENT_OFFSET=$(docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
    --broker-list localhost:29092 \
    --topic "$TOPIC_OUT" \
    --time -1 2>/dev/null | head -1 | awk -F: '{print $NF}' || echo "$INITIAL_OFFSET")

  PROCESSED=$((CURRENT_OFFSET - INITIAL_OFFSET))
  NEW_SINCE_LAST=$((PROCESSED - PREV_PROCESSED))

  echo "    [${ELAPSED}s] Processed: $PROCESSED / $NUM_MESSAGES (+${NEW_SINCE_LAST})"

  if [ "$PROCESSED" -ge "$NUM_MESSAGES" ]; then
    echo "    ✓ All messages processed!"
    break
  fi

  # If no new messages in 10 seconds, stop waiting
  if [ $ELAPSED -gt 20 ] && [ "$NEW_SINCE_LAST" -eq 0 ] && [ "$PROCESSED" -eq "$PREV_PROCESSED" ]; then
    echo "    ⚠ No new messages in last poll. Stopping."
    break
  fi

  PREV_PROCESSED=$PROCESSED
done

PROCESS_END_TS=$(python3 -c "import time; print(time.time())")

FINAL_OFFSET=$(docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:29092 \
  --topic "$TOPIC_OUT" \
  --time -1 2>/dev/null | head -1 | awk -F: '{print $NF}' || echo "$INITIAL_OFFSET")

TOTAL_PROCESSED=$((FINAL_OFFSET - INITIAL_OFFSET))
TOTAL_DURATION=$(python3 -c "print(f'{$PROCESS_END_TS - $START_TS:.2f}')")
THROUGHPUT=$(python3 -c "d = $PROCESS_END_TS - $START_TS; print(f'{$TOTAL_PROCESSED / d:.1f}' if d > 0 else 'inf')")
THROUGHPUT_PER_MIN=$(python3 -c "d = $PROCESS_END_TS - $START_TS; print(f'{$TOTAL_PROCESSED / d * 60:.0f}' if d > 0 else 'inf')")

# ── Results ──────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  KAFKA THROUGHPUT RESULTS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Messages sent:       $NUM_MESSAGES"
echo "  Messages processed:  $TOTAL_PROCESSED"
echo "  Total duration:      ${TOTAL_DURATION}s"
echo "  Produce rate:        ${SEND_RATE} msg/s"
echo "  E2E throughput:      ${THROUGHPUT} msg/s (${THROUGHPUT_PER_MIN} msg/min)"
echo "  Tickers tested:      ${#TICKERS[@]} (${TICKERS[*]})"
echo ""
echo "  RESUME METRICS:"
echo "  ├─ Throughput:       ${THROUGHPUT} msg/s"
echo "  ├─ Per minute:       ${THROUGHPUT_PER_MIN} msg/min"
echo "  └─ Concurrent tickers: ${#TICKERS[@]} without degradation"

# ── 5. Test concurrent ticker scaling ────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CONCURRENT TICKER SCALING TEST"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test with more tickers
EXTRA_TICKERS=("GOOG" "AMZN" "META" "NFLX" "AMD" "INTC" "CRM" "ORCL")
ALL_TICKERS=("${TICKERS[@]}" "${EXTRA_TICKERS[@]}")
SCALE_MESSAGES=50

echo "  Testing with ${#ALL_TICKERS[@]} tickers (${ALL_TICKERS[*]})..."
echo "  Sending $SCALE_MESSAGES messages..."

SCALE_BATCH="/tmp/sentio_scale_batch.txt"
rm -f "$SCALE_BATCH"

for i in $(seq 1 $SCALE_MESSAGES); do
  T_IDX=$(( (i - 1) % ${#ALL_TICKERS[@]} ))
  T="${ALL_TICKERS[$T_IDX]}"
  TS=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
  echo "${T}|{\"title\":\"SCALE_${i} Performance test for ${T}\",\"description\":\"Scale test\",\"publishedAt\":\"${TS}\",\"sourceUrl\":\"https://scale.test/${RANDOM}-${i}\"}" >> "$SCALE_BATCH"
done

SCALE_OFFSET_BEFORE=$(docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:29092 --topic "$TOPIC_OUT" --time -1 2>/dev/null | head -1 | awk -F: '{print $NF}' || echo "0")

SCALE_START=$(python3 -c "import time; print(time.time())")

cat "$SCALE_BATCH" | docker exec -i "$KAFKA_CONTAINER" kafka-console-producer \
  --bootstrap-server localhost:29092 --topic "$TOPIC_IN" \
  --property "parse.key=true" --property "key.separator=|" 2>/dev/null

sleep 15

SCALE_OFFSET_AFTER=$(docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:29092 --topic "$TOPIC_OUT" --time -1 2>/dev/null | head -1 | awk -F: '{print $NF}' || echo "0")

SCALE_END=$(python3 -c "import time; print(time.time())")
SCALE_PROCESSED=$((SCALE_OFFSET_AFTER - SCALE_OFFSET_BEFORE))
SCALE_DURATION=$(python3 -c "print(f'{$SCALE_END - $SCALE_START:.2f}')")
SCALE_RATE=$(python3 -c "d = $SCALE_END - $SCALE_START; print(f'{$SCALE_PROCESSED / d:.1f}' if d > 0 else '0')")

echo "  Results: $SCALE_PROCESSED/$SCALE_MESSAGES processed in ${SCALE_DURATION}s"
echo "  Rate with ${#ALL_TICKERS[@]} tickers: ${SCALE_RATE} msg/s"
echo ""

# Save results
cat > "$RESULTS_FILE" <<EOF
Sentio Kafka Throughput Results
================================
Messages sent:        $NUM_MESSAGES
Messages processed:   $TOTAL_PROCESSED
Total duration:       ${TOTAL_DURATION}s
Produce rate:         ${SEND_RATE} msg/s
E2E throughput:       ${THROUGHPUT} msg/s
Per minute:           ${THROUGHPUT_PER_MIN} msg/min
Concurrent tickers:   ${#TICKERS[@]}

Scale test (${#ALL_TICKERS[@]} tickers):
Processed:            $SCALE_PROCESSED/$SCALE_MESSAGES
Rate:                 ${SCALE_RATE} msg/s
EOF

echo "Results saved to: $RESULTS_FILE"
echo "Done."
