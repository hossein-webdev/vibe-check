---
name: database-selection
description: >
  Chooses (or re-evaluates) the database platform by workload instead of hype. Covers the three
  deciding axes — read/write ratio, schema-change strategy under live traffic, and ecosystem lock-in
  vs portability — plus the real ceilings of Supabase, Firebase, Convex, Neon, PlanetScale, and
  Cloudflare D1, and when to unbundle an all-in-one platform. Activates when the user asks "which
  database should I use", compares Supabase vs Firebase vs Convex vs Neon vs PlanetScale vs D1,
  mentions outgrowing a free tier, edge databases, serverless Postgres/MySQL, cold starts, branching
  migrations, or moving off a platform. Child of data-architecture; applies when a database choice
  is open or in doubt.
user-invokable: true
metadata:
  category: data-architecture
  parent: data-architecture
  version: "2.0.0"
---

# Database Selection

"Which database?" is really "which architecture fits my workload?" — the brand is the last step, not
the first. Let the workload choose: the wrong pick surfaces months later as cold-start complaints,
locked tables during migrations, or a platform you can't leave.

Freedom: **medium** — a decision framework, not a single right answer.

## Rules

| ID | Check | If it fails |
|---|---|---|
| DBS-01 | Choice matches the read/write profile (edge for read-heavy global; sharding/autoscale for write-heavy) | P2 |
| DBS-02 | A schema-change-under-traffic strategy exists (branch/test/merge or equivalent) | P2 |
| DBS-03 | Lock-in is a conscious decision (know whether you chose a database or a platform) | P3 |
| DBS-04 | The platform's known ceiling isn't in your growth path (or an exit is planned) | P2 |
| DBS-05 | Migration timing decided by math (workaround cost vs migration cost), not frustration | P3 |

## When to Use This Skill

- User asks "which database / which platform should I use?" or compares providers.
- User is outgrowing a free tier or an all-in-one platform (auth complexity, engine mismatch, scale).
- User mentions edge databases, serverless Postgres/MySQL, cold starts, or branching migrations.
- An audit finds the current database fighting the workload.

## How It Works

### The three deciding axes

1. **Read/write ratio (DBS-01).** ~90% reads and a global audience → an edge database (Cloudflare
   D1: SQLite in-region, sub-millisecond reads). Heavy concurrent writes → a write-oriented platform:
   PlanetScale (horizontal sharding) or Neon (autoscaling compute). Mixing is fine — D1 at the edge
   for reads, Postgres/MySQL behind the API for writes.
2. **Schema changes under live traffic (DBS-02).** You *will* add a column with active users. Neon
   and PlanetScale offer **branching**: copy production, test the migration, merge with zero
   downtime. Edge SQLite locks differently. Ask "how do I alter a table under traffic?" of every
   candidate before committing.
3. **Lock-in vs portability (DBS-03).** D1 is most powerful *inside* the Cloudflare stack
   (Workers/R2/KV/Durable Objects) — compelling, and a commitment. Neon/PlanetScale run standard
   Postgres/MySQL — far easier to migrate away from. Both choices are valid; know which one you're
   making.

### Platform cheat sheet (ceilings included — DBS-04)

| Platform | Sweet spot | Ceiling / trade-off |
|---|---|---|
| Supabase | Production Postgres you own, fast start | Unbundle when auth gets complex, engine mismatches, or scale outgrows it |
| Firebase | Fastest throwaway prototype | Query model + data ownership limits for real products |
| Convex | Real-time, no-SQL, no-migrations DX | Different mental model; know the trade-offs before lock-in |
| Neon | Serverless Postgres, branching, scale-to-zero | Cold-start latency after idle — felt in latency-sensitive apps |
| PlanetScale | Serverless MySQL, HTTP connections (no pool ceiling), zero-downtime deploy requests | MySQL: no DB-enforced foreign keys; different query mindset |
| Cloudflare D1 | Read-heavy, globally distributed, edge-native | Weak concurrent-write performance; ecosystem commitment |

### When to migrate off (DBS-05) — math, not frustration

One of the most expensive decisions in a product's life, wrong in both directions:
- **Staying too long:** connection limits maxed, pricing tiers jumping, and every workaround
  (pooler, aggressive caching, query contortions) is technical debt with a monthly payment — hours
  spent fighting the platform instead of building.
- **Moving too early:** migration is real coordination — schema, data transfer, connection strings
  across services, ORM reconfig, re-testing every query — two weeks spent solving a problem you
  didn't have yet.

Three questions decide it:
1. Can the current platform handle **10× the load with optimization alone**? → stay and optimize.
2. Is a capability you need **architecturally impossible** here? → migrate; optimization can't fix
   a missing capability.
3. Do **workaround-hours × your rate exceed the migration cost**? → run the numbers; when the math
   says go, go **decisively** — milestones, rollback points, verification checklists. A slow,
   half-committed migration is the most expensive kind.

### Decision procedure

1. Write down: reads vs writes (measure if live), latency geography, expected schema-change
   frequency, team's engine familiarity, and how bad lock-in would hurt.
2. Score the candidates on the three axes; eliminate anything whose **ceiling** sits in your growth
   path unless you accept a planned migration.
3. Prefer boring: standard Postgres (Supabase/Neon) wins ties — most portable, most hireable.

## Fix playbook

```text
Outgrowing an all-in-one (e.g. Supabase)? Unbundle one piece at a time:
 1. Identify the pressure point: auth complexity / engine fit / scale.
 2. Move only that piece (e.g. auth → dedicated provider) — keep the DB if it still fits.
Wrong engine for the workload?
 1. Add the fitting store for the hot path first (e.g. D1/read replica for global reads)
 2. Migrate fully only when measurements say the split isn't enough.
```

## Examples

### Example 1: "Supabase or Firebase or Convex or Neon?"
**Output**:
```
There is no universal answer — score your workload:
- Prototype you may throw away → Firebase.  Real product, own your data, SQL → Supabase.
- Real-time collaboration DX → Convex (accept the model).  Spiky traffic, branching migrations → Neon.
Tie-breaker: standard Postgres (portability + hiring).
```

### Example 2: "Users in Asia say reads are slow; writes are modest"
**Output**:
```
Read-heavy + global = edge reads [DBS-01]: D1 (or a read replica/CDN cache) close to users,
keep Postgres behind the API for writes. Check DBS-04: D1's write concurrency is not your
bottleneck here because writes stay in Postgres.
```

## Do / Don't

- **Do** decide on read/write ratio, migration strategy, and lock-in — in that order.
- **Do** know each platform's ceiling before you hit it.
- **Don't** pick by hype or tutorial momentum.
- **Don't** confuse choosing a database with choosing an ecosystem — both are fine, but know which.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
