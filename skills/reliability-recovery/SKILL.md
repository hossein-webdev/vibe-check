---
name: reliability-recovery
description: >
  Keeps an app up and able to recover when something breaks — graceful failure handling, backups
  whose restores are actually tested against recovery targets, availability planning, and resilience
  to third-party failures (timeouts, retries with backoff, circuit breakers, fallbacks). Activates
  when the user mentions reliability, resilience, graceful failure, retries/fallbacks, backups,
  restore, recovery point/time objectives, availability, downtime, or "what happens when an upstream
  API changes or goes down?". Applies to apps that hold user data or promise uptime.
user-invokable: true
metadata:
  category: reliability-recovery
  version: "2.0.0"
---

# Reliability & Recovery

The part nobody thinks about until it's the middle of the night. **Availability** means the app is
up when people need it; **recovery** means you can bring it back when it isn't. Generated apps
usually have neither — no graceful failure, no tested backups, no plan.

Skip for throwaway or no-data apps. Freedom: **medium**.

## Rules

| ID | Check | If it fails |
|---|---|---|
| REL-01 | Risky operations fail gracefully (no frozen UI; retry/fallback/clear error) | P2 |
| REL-02 | A restore has been **performed and timed**; recovery targets (data-loss window, downtime budget) defined and met | P1 with user data |
| REL-03 | Third-party calls wrapped: timeout + retry/backoff + circuit breaker + fallback | P2 |
| REL-04 | Availability planned: health checks, alerting, written recovery steps | P2 |

## When to Use This Skill

- User mentions reliability, resilience, uptime/availability, or downtime.
- User mentions backups, restore, or recovery point/time objectives.
- User asks what happens when a dependency (third-party API, rate limit, free tier) fails.
- The app freezes on errors instead of degrading.

## How It Works

1. **Fail softly (REL-01).** Wrap risky operations so failure degrades instead of locking the UI —
   a retry, a fallback value, or a clear message beats an endless spinner.
2. **A backup isn't real until restored (REL-02).** Schedule backups *and* run restore drills.
   Define how much data you can afford to lose and how long recovery may take — then prove both by
   timing an actual restore. An untested backup is a hope, not a plan.
3. **Survive third parties (REL-03).** Upstream APIs change, rate-limit, and kill free tiers. Every
   external call gets a **timeout**, **retries with backoff**, a **circuit breaker** so a dead
   dependency can't queue you to death, and a **fallback** so one vendor can't take you down.
4. **Plan availability (REL-04).** Define "up", add health checks + alerting (→ `observability`),
   and write the recovery steps *before* you need them at 2am.

## Fix playbook

```text
Restore never tested [REL-02]:
 1. Restore the latest backup to a scratch database — time it.
 2. Write down: data-loss window (backup frequency) + measured restore time.
 3. If either misses your target: raise backup frequency / rehearse the procedure.
Third-party fragility [REL-03] (per external call):
 timeout(5s) → retry ×2-3 with exponential backoff + jitter → circuit breaker (open after N fails)
 → fallback (cached value / degraded feature / honest error).
UI freezes on failure [REL-01]:
 1. Find awaits with no catch/timeout on the critical path.
 2. Add error boundaries + loading/error states; never leave a spinner unbounded.
```

## Examples

### Example 1: "The whole app freezes when one API call fails"
**Output**:
```
[REL-01/03] Wrap the call: timeout → backoff retries → circuit breaker → fallback state.
One vendor's outage should degrade a feature, not lock your UI.
```

### Example 2: "I have backups — am I safe?"
**Output**:
```
[REL-02] Unknown until you restore one. Do it now on a scratch DB and time it; set your
data-loss window and downtime budget; verify the drill meets both. Backups that were never
restored fail at the worst possible moment.
```

## Do / Don't

- **Do** run timed restore drills; wrap every third-party call (timeout/backoff/breaker/fallback).
- **Do** write the 2am recovery steps in daylight.
- **Don't** count an untested backup as a backup.
- **Don't** let one dependency's failure freeze the whole app.
