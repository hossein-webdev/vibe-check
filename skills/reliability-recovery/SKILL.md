---
name: reliability-recovery
description: >
  Keeps an app up and able to recover when something breaks — graceful failure handling, backups whose
  restores are actually tested, availability planning, and resilience to third-party failures.
  Activates when the user mentions reliability, resilience, graceful failure, retries/fallbacks,
  backups, restore, recovery point/time objectives, availability, downtime, or "what happens when an
  upstream API changes or goes down?". Applies to apps that hold user data or promise uptime.
user-invokable: true
metadata:
  category: reliability-recovery
---

# Reliability & Recovery

The part you don't think about until it's the middle of the night. **Availability** means the app is up
when people need it; **recovery** means you can bring it back when it isn't. Generated apps usually have
neither — no graceful failure, no tested backups, no plan.

Skip for throwaway or no-data apps. Otherwise, freedom: **medium** — adapt to your stack.

## When to Use This Skill

- User mentions reliability, resilience, uptime/availability, or downtime.
- User mentions backups, restore, or recovery point/time objectives.
- User asks what happens when a dependency (a third-party API, a rate limit, a free tier) fails.
- The app freezes on errors instead of degrading.
- User is preparing for launch or an SLA conversation.

## How It Works

1. **Fail softly, don't freeze.** Wrap risky operations so a failure degrades the experience instead of
   locking the UI — a retry, a fallback value, or a clear message beats an endless spinner.
2. **A backup isn't real until you've restored from it.** Schedule backups *and* run actual restore
   drills. Define how much data you can afford to lose and how long recovery may take, then prove your
   backups meet both by timing a real restore.
3. **Plan availability.** Decide what "up" means, add health checks and alerting (see `observability`),
   and write down the manual recovery steps before you need them.
4. **Survive third-party failure.** Apps break when an upstream API changes, a rate limit kicks in, or a
   free tier disappears. Add **timeouts, retries with backoff, circuit breakers, and fallbacks** so one
   outside service can't take you down with it.

## Examples

### Example 1: "The whole app freezes when one API call fails"
**Action**: Add graceful degradation.
**Output**:
```
Wrap the call: timeout → retry with backoff → fallback value or a clear error state.
One dependency failing should never lock the UI; degrade instead of freezing.
```

### Example 2: "I have backups — am I safe?"
**Action**: Force a restore drill.
**Output**:
```
A backup you've never restored is a guess. Run a real restore now and time it.
Set your acceptable data-loss window and recovery time, then confirm the backups actually meet them.
```

## Do / Don't

- **Do** test restores on a schedule and track recovery targets from real drills.
- **Do** wrap third-party calls in timeouts, retries, circuit breakers, and fallbacks.
- **Don't** assume a backup works until you've restored it.
- **Don't** let the UI freeze on failure — degrade gracefully.
