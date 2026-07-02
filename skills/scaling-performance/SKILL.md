---
name: scaling-performance
description: >
  Keeps an app responsive as usage grows — the point where something fine for ten people slows to a
  crawl for a hundred and falls over at a thousand. Covers database connection pooling, caching layers
  (browser/CDN/application/Redis), moving heavy work to background jobs with idempotency, query tuning
  with the query planner, and splitting/scaling the database. Activates when the user mentions a slow
  app, scaling, crashes under load, timeouts, surviving a sign-up spike, connection limits, caching,
  background jobs, or slow queries. Applies to apps with a backend or database expecting real traffic.
user-invokable: true
metadata:
  category: scaling-performance
---

# Scaling & Performance

Generated code is usually tuned for "returns the right answer," not "returns it quickly when lots of
people ask at once." A query that's instant on a handful of rows can take many seconds on a large
table, and a request pattern that's fine for one user can saturate the database when fifty hit it
together. The app looks broken; really it's just out of headroom.

Skip if the app is static or genuinely low-traffic. Otherwise, freedom: **medium** — recommended
patterns, adapt to the stack.

## When to Use This Skill

- The app is slow, or "fine for me, slow for users", or crashes under load.
- A sign-up spike froze it, or users hit a blank/spinning screen, or requests time out.
- User mentions connection limits/pooling, caching, Redis, background jobs, or queues.
- User added indexes and it's "still slow", or asks how to find the bottleneck.
- User is prepping for launch or a traffic event.

## Diagnose in order (before you spend on bigger infra)

Bigger servers and read replicas are the expensive instinct. Check these three branches **in order** —
the wrong branch costs money and fixes nothing:

1. **Connections vs capacity.** ~90% of the time the database is fine but too many connections fight for
   too few slots. A **connection pooler** (PgBouncer, Supavisor, or built-in managed pooling) fixes it
   for ~$0. Adding a read replica *before* a pooler just doubles cost to solve a free problem.
2. **Query vs volume.** Read the query stats (`pg_stat_statements`). The culprit is usually not the
   slowest query but the *most frequent* one — a 40 ms query run 10k×/day burns ~400 s of DB time a day.
   One index / cache / rewrite beats new hardware.
3. **Read vs write.** ~80% of operations are reads, and a read replica only helps reads. If **writes**
   are the bottleneck, replicas make contention *worse* — use queues, background jobs, and write-batching.

## How It Works (handle your first surge — about 30 minutes each)

1. **Pool your database connections first.** If every request opens its own connection, a modest burst
   exhausts the limit and the app stalls. A connection pool reuses a small set. This is the single most
   common cause of "great in the demo, dead at launch."
2. **Add caching in layers** (no change to business logic):
   - **browser** cache for static assets,
   - **CDN/edge** cache for shared responses,
   - **application** cache for frequent identical responses,
   - **query** cache for repeated reads.
   The same data is often fetched over and over — cache the hot paths. If you add **Redis**, you now
   have a second copy of the truth, so plan for **invalidation**, **stampede protection**, and keeping
   the layers **consistent**.
3. **Push slow work into the background.** Long operations inside the request cause timeouts; hand them
   to **workers**, and use **idempotency keys** so a retry doesn't run the job (or the charge) twice.
4. **Tune queries with evidence.** Adding indexes blind rarely helps. Read the **query plan** first,
   find the real hotspot, then index or restructure.
5. **Scale the database when one instance isn't enough** (very large tables, multi-second queries):
   shard by tenant, add read replicas, or move to a serverless engine (see `data-architecture`).
6. **Mind the request-fan-out limit.** Too many simultaneous calls can freeze an app that demoed fine —
   the fix is structural (batching, queues, caching), not a one-line patch.

## Examples

### Example 1: "A wave of sign-ups froze the app"
**Action**: Classic connection exhaustion.
**Output**:
```
First-surge fixes (~30 min each):
1. Enable connection pooling — you're hitting the connection limit.
2. Cache the hottest reads (application + query cache).
3. Move heavy work to a background worker with idempotency keys.
```

### Example 2: "Added indexes, still slow"
**Action**: Stop guessing; read the plan.
**Output**:
```
Run the query planner on the slow query → read it (sequential scan? bad join?) → index/restructure the
actual hotspot. Then cache the repeated reads.
```

## Do / Don't

- **Do** pool connections and cache hot reads before anything else.
- **Do** read the query plan before adding indexes.
- **Don't** run heavy work inside the request — use background workers + idempotency.
- **Don't** assume "fine in the demo" means it scales.
