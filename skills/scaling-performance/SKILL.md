---
name: scaling-performance
description: >
  Keeps an app responsive as usage grows — the point where something fine for ten people slows to a
  crawl for a hundred and falls over at a thousand. Covers the ordered scaling decision tree
  (connections → queries → reads/writes) before spending on infrastructure, database connection
  pooling, caching layers (browser/CDN/application/Redis), moving heavy work to background jobs with
  idempotency, and query tuning with the query planner. Activates when the user mentions a slow app,
  scaling, crashes under load, timeouts, surviving a sign-up spike, connection limits, caching,
  background jobs, or slow queries. Applies to apps with a backend or database expecting real
  traffic.
user-invokable: true
metadata:
  category: scaling-performance
  version: "2.0.0"
---

# Scaling & Performance

Generated code is tuned for "returns the right answer", not "returns it fast when everyone asks at
once". A query that's instant on 100 rows can take 30 seconds on 100,000; a burst of sign-ups can
freeze an app whose database is merely out of connection slots. The expensive instinct — bigger
servers, more replicas — usually solves the wrong problem. Diagnose in order first.

Skip if the app is static or genuinely low-traffic. Freedom: **medium**. Serverless platform
detected → weight pooling and background-jobs checks up (functions multiply connections).

## Rules

| ID | Check | If it fails |
|---|---|---|
| SCALE-01 | Database connections pooled (PgBouncer/Supavisor/managed pooling) | P1 under real traffic |
| SCALE-02 | Diagnosis follows the tree: connections → queries → reads/writes, before infra spend | P2 (cost) |
| SCALE-03 | Hot reads cached at the right layer (browser/CDN/app/query) | P2 |
| SCALE-04 | Cache invalidation, stampede protection, layer coherence handled where Redis exists | P2 |
| SCALE-05 | Heavy work in background workers with idempotency keys | P2 (P1 if payments retry) |
| SCALE-06 | Query tuning driven by the planner (`EXPLAIN ANALYZE` / `pg_stat_statements`), not guesses | P3 |
| SCALE-07 | Read/write split correct: replicas only for read bottlenecks; writes get queues/batching | P2 |

## When to Use This Skill

- The app is slow, or "fine for me, slow for users", or crashes under load.
- A sign-up spike froze it, users hit a blank/spinning screen, requests time out.
- User mentions connection limits/pooling, caching, Redis, background jobs, or queues.
- User added indexes and it's "still slow", or asks how to find the bottleneck.

## How It Works — one flow, diagnose then fix

**Branch 1 — connections vs capacity (SCALE-01/02).** ~90% of "database is dying" is connection
exhaustion: 200 requests fighting for 50 slots while the database itself is fine. A **connection
pooler** fixes it for ~$0 (PgBouncer, Supavisor, or the platform's built-in). Adding a read replica
*before* a pooler doubles your bill to solve a free problem. Fix: enable pooling; size the pool to
the platform limit; on serverless, use a pooled connection string.

**Branch 2 — query vs volume (SCALE-06).** Read `pg_stat_statements`: the culprit is usually not
the slowest query but the **most frequent** one — 40 ms × 10,000 runs/day is 400 s of daily DB time.
`EXPLAIN ANALYZE` the top offenders; one index, one cache, or one rewrite beats new hardware.

**Branch 3 — read vs write (SCALE-07).** ~80% of operations are reads, and replicas help **only
reads**. If writes are the bottleneck, replicas worsen contention — you need **queues, background
jobs, write batching**.

**Then the standing fixes:**
- **Cache in layers (SCALE-03/04):** browser (static) → CDN/edge (shared responses) → application
  (frequent identical responses) → query cache (repeated reads). Adding Redis creates a second
  source of truth: plan invalidation, stampede protection, and coherence, or you'll serve stale data.
- **Caching is a business decision (SCALE-04): decide what's allowed to be wrong, and for how long.**
  Nobody plans a caching strategy — an app gets slow, someone adds Redis, everyone moves on; six
  months later a customer's upgraded plan still shows free tier and receipts don't match page prices.
  Three decisions to make *on purpose*:
  1. **Staleness budget per data class** — company address: cache forever; blog content: an hour;
     **pricing, permissions, inventory, account status: never stale** — stale pricing leaks money on
     every transaction, stale permissions mean a deactivated user still has access, and none of it
     shows up as errors — it shows up as support tickets and refunds.
  2. **Who clears the cache when data changes** — prefer **event-driven invalidation** (data changes
     → cache clears immediately) over TTL timers; with a timer, the data is wrong for the timer's
     entire duration.
  3. **What happens when the cache itself fails** — an expiring hot key can send thousands of
     simultaneous requests at the database (**stampede**); it never shows in testing and always
     shows on your biggest day. Use stampede protection (locking / single-flight refresh).
- **Background jobs (SCALE-05):** long work inside the request causes timeouts; hand it to workers
  with **idempotency keys** so a retry never runs the job — or the charge — twice. The generated
  anti-pattern is the **synchronous chain**: a 12-second checkout where the user stares at a spinner
  while the app sends a receipt email. Split it:
  1. **Respond the moment the core action succeeds** (payment confirmed → confirmation returned);
     everything else — email, analytics, fulfillment kicks — goes to the queue.
  2. **The queue retries independently** — a failed receipt email must not fail the checkout the
     user already saw succeed.
  3. **Monitor the queue** — a job failing silently in a queue is *worse* than failing in the
     request; log every failed job and alert on failure spikes (→ `observability`, and dead-letter
     queues in OBS-08).

## Fix playbook

```text
Sign-up spike froze the app [SCALE-01]:
 1. Enable pooling (Supavisor/PgBouncer/platform pooler); use the pooled connection string.
 2. Cache the hottest reads (app + query layer).
 3. Move heavy work to a worker with idempotency keys.
"Added indexes, still slow" [SCALE-06]:
 1. SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
 2. EXPLAIN ANALYZE the top entries; fix the actual hotspot (seq scan? bad join? missing index?).
Write contention [SCALE-07]:
 1. Queue writes (pg-boss/BullMQ); batch where semantics allow. Replicas won't help — skip them.
```

## Examples

### Example 1: "50 people signed up and the app froze"
**Output**:
```
Branch 1 first [SCALE-01]: you're out of connection slots, not capacity. Pooler (~30 min, ~$0),
then cache hot reads, then background-job the heavy work. No replicas yet — wrong branch.
```

### Example 2: "Should I add a read replica? DB feels slow"
**Output**:
```
Walk the tree [SCALE-02]: pooling on? → pg_stat_statements top-10 → is the bottleneck reads or
writes? Replicas only pay off at branch 3 with a proven READ bottleneck [SCALE-07]. Skipping the
tree is how a $0 fix becomes a five-figure infra bill.
```

## Do / Don't

- **Do** diagnose in order: connections → queries → reads/writes. Pooler before replica, always.
- **Do** cache hot reads and background heavy work with idempotency.
- **Don't** buy infrastructure before `pg_stat_statements` has spoken.
- **Don't** add replicas for a write bottleneck — they make it worse.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
