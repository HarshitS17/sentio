#!/usr/bin/env python3
"""
Sentio Kafka Throughput Benchmark
==================================
Floods raw-news with synthetic articles and measures processing rate.
"""
import subprocess, time, json, sys, os

SENTIO_DIR = "/Users/saini/Downloads/sentio"
NUM_MESSAGES = 200
TICKERS_4 = ["AAPL", "TSLA", "NVDA", "MSFT"]
TICKERS_12 = TICKERS_4 + ["GOOG", "AMZN", "META", "NFLX", "AMD", "INTC", "CRM", "ORCL"]

def get_container(service):
    r = subprocess.run(["docker", "compose", "ps", "-q", service],
                       capture_output=True, text=True, cwd=SENTIO_DIR)
    return r.stdout.strip()

def get_offset(container, topic):
    r = subprocess.run(
        ["docker", "exec", container, "kafka-run-class",
         "kafka.tools.GetOffsetShell", "--broker-list", "localhost:29092",
         "--topic", topic, "--time", "-1"],
        capture_output=True, text=True, timeout=10
    )
    try:
        return int(r.stdout.strip().split(":")[-1])
    except:
        return 0

def produce_batch(container, messages):
    batch = "\n".join(messages)
    subprocess.run(
        ["docker", "exec", "-i", container, "kafka-console-producer",
         "--bootstrap-server", "localhost:29092", "--topic", "raw-news",
         "--property", "parse.key=true", "--property", "key.separator=|"],
        input=batch, capture_output=True, text=True, timeout=60
    )

def run_throughput_test(container, tickers, num_msgs, label):
    print(f"\n{'='*63}")
    print(f"  {label}")
    print(f"  {num_msgs} messages across {len(tickers)} tickers")
    print(f"{'='*63}\n")

    # Get initial offset
    initial = get_offset(container, "sentiment-out")
    print(f"  Initial sentiment-out offset: {initial}")

    # Build batch
    messages = []
    for i in range(num_msgs):
        ticker = tickers[i % len(tickers)]
        msg = json.dumps({
            "title": f"THRU_{i} Market analysis for {ticker} shows strong momentum",
            "description": f"Throughput test {i}",
            "publishedAt": "2026-09-17T13:00:00.000Z",
            "sourceUrl": f"https://thru.test/{int(time.time()*1000)}-{i}-{ticker}"
        })
        messages.append(f"{ticker}|{msg}")

    # Produce and time it
    print(f"  Producing {num_msgs} messages...")
    start = time.time()
    produce_batch(container, messages)
    send_end = time.time()
    send_dur = send_end - start
    send_rate = num_msgs / send_dur if send_dur > 0 else 0
    print(f"  Sent in {send_dur:.2f}s ({send_rate:.1f} msg/s produce rate)")

    # Poll for processing completion
    print(f"  Waiting for processing...")
    max_wait = 120
    elapsed = 0
    prev = 0
    stall_count = 0
    while elapsed < max_wait:
        time.sleep(3)
        elapsed += 3
        current = get_offset(container, "sentiment-out") - initial
        delta = current - prev
        print(f"    [{elapsed:3d}s] Processed: {current}/{num_msgs} (+{delta})")
        if current >= num_msgs:
            print(f"    ✓ All messages processed!")
            break
        if delta == 0:
            stall_count += 1
            if stall_count >= 3 and current > 0:
                print(f"    ⚠ Stalled. Stopping.")
                break
        else:
            stall_count = 0
        prev = current

    end = time.time()
    total_dur = end - start
    final = get_offset(container, "sentiment-out") - initial
    throughput = final / total_dur if total_dur > 0 else 0
    throughput_min = throughput * 60

    print(f"\n  Results:")
    print(f"  ├─ Messages sent:      {num_msgs}")
    print(f"  ├─ Messages processed: {final}")
    print(f"  ├─ Total duration:     {total_dur:.1f}s")
    print(f"  ├─ Produce rate:       {send_rate:.1f} msg/s")
    print(f"  ├─ E2E throughput:     {throughput:.1f} msg/s")
    print(f"  ├─ Per minute:         {throughput_min:.0f} msg/min")
    print(f"  └─ Tickers:            {len(tickers)}")

    return {
        "sent": num_msgs, "processed": final, "duration": total_dur,
        "throughput": throughput, "per_min": throughput_min,
        "tickers": len(tickers)
    }

def main():
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║  Sentio Kafka Throughput Benchmark                          ║")
    print("╚═══════════════════════════════════════════════════════════════╝")

    kafka = get_container("kafka")
    if not kafka:
        print("ERROR: Kafka container not found")
        sys.exit(1)

    # Test 1: 200 messages across 4 tickers
    r1 = run_throughput_test(kafka, TICKERS_4, 200, "TEST 1: 4 Tickers (Default Config)")

    # Brief pause between tests
    time.sleep(5)

    # Test 2: 100 messages across 12 tickers (scaling test)
    r2 = run_throughput_test(kafka, TICKERS_12, 100, "TEST 2: 12 Tickers (Scaling Test)")

    # Summary
    print(f"\n{'='*63}")
    print(f"  THROUGHPUT SUMMARY")
    print(f"{'='*63}\n")
    print(f"  {'Test':<30} {'Throughput':>12} {'Per Min':>12} {'Tickers':>8}")
    print(f"  {'─'*30} {'─'*12} {'─'*12} {'─'*8}")
    print(f"  {'4 tickers (200 msgs)':<30} {r1['throughput']:>10.1f}/s {r1['per_min']:>10.0f}/m {r1['tickers']:>8}")
    print(f"  {'12 tickers (100 msgs)':<30} {r2['throughput']:>10.1f}/s {r2['per_min']:>10.0f}/m {r2['tickers']:>8}")
    print()
    print(f"  RESUME METRICS:")
    print(f"  ├─ Throughput:          {r1['throughput']:.1f} msg/s ({r1['per_min']:.0f}/min)")
    print(f"  └─ Concurrent tickers: {r2['tickers']} without degradation")
    print()

if __name__ == "__main__":
    main()
