#!/usr/bin/env python3
"""
Sentio Pipeline Latency Benchmark
==================================
Injects synthetic articles into raw-news, monitors app logs for
[Processor] Scored lines, and computes end-to-end latency.
"""
import subprocess, time, re, statistics, json, sys, os

NUM_MESSAGES = 30
SENTIO_DIR = "/Users/saini/Downloads/sentio"

def get_kafka_container():
    result = subprocess.run(
        ["docker", "compose", "ps", "-q", "kafka"],
        capture_output=True, text=True, cwd=SENTIO_DIR
    )
    return result.stdout.strip()

def inject_message(container, ticker, idx, send_ts_ms):
    title = f"LATBENCH_{send_ts_ms} Stock headline for benchmark test {idx}"
    article = json.dumps({
        "title": title,
        "description": f"Benchmark article {idx}",
        "publishedAt": "2026-09-17T13:00:00.000Z",
        "sourceUrl": f"https://latbench.test/{send_ts_ms}-{idx}"
    })
    msg = f"{ticker}|{article}"
    subprocess.run(
        ["docker", "exec", "-i", container, "kafka-console-producer",
         "--bootstrap-server", "localhost:29092", "--topic", "raw-news",
         "--property", "parse.key=true", "--property", "key.separator=|"],
        input=msg, capture_output=True, text=True, timeout=10
    )

def get_app_log():
    """Read the Spring Boot app log"""
    log_dir = "/Users/saini/.gemini/antigravity/brain/7453e7d4-0251-47d6-9a86-733548ec8856/.system_generated/tasks"
    # Find task-80.log (the Spring Boot daemon)
    log_path = os.path.join(log_dir, "task-80.log")
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            return f.read()
    return ""

def parse_log_timestamps(log_text, marker_prefix="LATBENCH_"):
    """Extract scored timestamps from log lines like:
    2026-09-17T19:15:18.757+05:30  INFO ... [Processor] Scored: ... headline="LATBENCH_1234..."
    """
    results = {}
    pattern = re.compile(
        r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2})\s+INFO.*\[Processor\] Scored:.*headline="' + marker_prefix + r'(\d+)'
    )
    for match in pattern.finditer(log_text):
        log_ts_str = match.group(1)
        send_ts_ms = int(match.group(2))
        # Parse the log timestamp to epoch ms
        # Format: 2026-09-17T19:15:18.757+05:30
        from datetime import datetime, timezone, timedelta
        # Handle +05:30 timezone
        ts_part = log_ts_str[:-6]  # remove +05:30
        tz_part = log_ts_str[-6:]  # +05:30
        tz_sign = 1 if tz_part[0] == '+' else -1
        tz_hours = int(tz_part[1:3])
        tz_mins = int(tz_part[4:6])
        tz = timezone(timedelta(hours=tz_sign * tz_hours, minutes=tz_sign * tz_mins))
        
        dt = datetime.strptime(ts_part, "%Y-%m-%dT%H:%M:%S.%f")
        dt = dt.replace(tzinfo=tz)
        scored_ts_ms = int(dt.timestamp() * 1000)
        results[send_ts_ms] = scored_ts_ms
    return results

def parse_aggregator_timestamps(log_text, marker_prefix="LATBENCH_"):
    """Extract aggregator timestamps"""
    results = {}
    pattern = re.compile(
        r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2})\s+INFO.*\[Aggregator\] ticker=LAT'
    )
    for match in pattern.finditer(log_text):
        log_ts_str = match.group(1)
        from datetime import datetime, timezone, timedelta
        ts_part = log_ts_str[:-6]
        tz_part = log_ts_str[-6:]
        tz_sign = 1 if tz_part[0] == '+' else -1
        tz_hours = int(tz_part[1:3])
        tz_mins = int(tz_part[4:6])
        tz = timezone(timedelta(hours=tz_sign * tz_hours, minutes=tz_sign * tz_mins))
        dt = datetime.strptime(ts_part, "%Y-%m-%dT%H:%M:%S.%f")
        dt = dt.replace(tzinfo=tz)
        scored_ts_ms = int(dt.timestamp() * 1000)
        results[len(results)] = scored_ts_ms
    return results

def main():
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║  Sentio Pipeline Latency Benchmark                          ║")
    print(f"║  Injecting {NUM_MESSAGES} synthetic articles                          ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print()

    container = get_kafka_container()
    if not container:
        print("ERROR: Kafka container not found")
        sys.exit(1)

    # Record log size before injection to only parse new entries
    log_before = get_app_log()
    log_offset = len(log_before)

    # Inject messages with precise timestamps
    print(f"[1/3] Injecting {NUM_MESSAGES} messages with embedded timestamps...")
    send_times = {}
    for i in range(1, NUM_MESSAGES + 1):
        send_ts = int(time.time() * 1000)
        ticker = "LATTEST"
        inject_message(container, ticker, i, send_ts)
        send_times[send_ts] = i
        if i % 10 == 0:
            print(f"    Sent {i}/{NUM_MESSAGES}")
        time.sleep(0.05)  # 50ms between messages

    print(f"    All {NUM_MESSAGES} messages injected.")
    print()

    # Wait for processing
    print("[2/3] Waiting for pipeline processing (15s)...")
    time.sleep(15)

    # Parse log for scored entries
    print("[3/3] Analyzing app logs for scoring timestamps...")
    full_log = get_app_log()
    new_log = full_log[log_offset:]

    scored = parse_log_timestamps(new_log)

    # Compute latencies
    latencies = []
    for send_ts, msg_idx in send_times.items():
        if send_ts in scored:
            lat = scored[send_ts] - send_ts
            if 0 < lat < 30000:  # sanity check
                latencies.append(lat)

    print()
    print("═══════════════════════════════════════════════════════════════")
    print("  PIPELINE LATENCY RESULTS (raw-news → VADER score)")
    print("═══════════════════════════════════════════════════════════════")
    print()

    if latencies:
        latencies.sort()
        n = len(latencies)
        avg = statistics.mean(latencies)
        med = statistics.median(latencies)
        p95 = latencies[int(n * 0.95)] if n > 1 else latencies[0]
        p99 = latencies[int(n * 0.99)] if n > 1 else latencies[0]

        print(f"  Messages matched:  {n}/{NUM_MESSAGES}")
        print(f"  Min latency:       {min(latencies)}ms")
        print(f"  Average latency:   {avg:.0f}ms")
        print(f"  Median latency:    {med:.0f}ms")
        print(f"  P95 latency:       {p95}ms")
        print(f"  P99 latency:       {p99}ms")
        print(f"  Max latency:       {max(latencies)}ms")
        print()
        print(f"  RESUME METRICS:")
        print(f"  ├─ Average: {avg:.0f}ms")
        print(f"  └─ P95:     {p95}ms")
    else:
        print(f"  Could not match timestamps. Found {len(scored)} scored entries in logs.")
        print(f"  Send timestamps: {list(send_times.keys())[:5]}...")
        if scored:
            print(f"  Scored timestamps: {list(scored.keys())[:5]}...")

    # Also count aggregator entries
    agg_count = new_log.count("[Aggregator]")
    print()
    print(f"  Aggregator updates observed: {agg_count}")
    
    # Check Redis
    print()
    print("  Redis snapshot check:")
    result = subprocess.run(
        ["docker", "exec", subprocess.run(["docker", "compose", "ps", "-q", "redis"],
         capture_output=True, text=True, cwd=SENTIO_DIR).stdout.strip(),
         "redis-cli", "GET", "snapshot:LATTEST"],
        capture_output=True, text=True, cwd=SENTIO_DIR
    )
    if result.stdout.strip() and result.stdout.strip() != "(nil)":
        try:
            snap = json.loads(result.stdout.strip())
            print(f"  ├─ Ticker: {snap.get('ticker')}")
            print(f"  ├─ Samples: {snap.get('sampleCount')}")
            print(f"  ├─ Rolling Avg: {snap.get('rollingAverage', 0):.4f}")
            print(f"  └─ Trend: {snap.get('trend')}")
        except:
            print(f"  ✓ Snapshot exists in Redis")
    else:
        print(f"  ⚠ No snapshot found for LATTEST ticker")

    print()
    print("═══════════════════════════════════════════════════════════════")

if __name__ == "__main__":
    main()
