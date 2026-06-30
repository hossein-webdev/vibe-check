---
name: observability
description: >
  Adds logging, error tracking, monitoring, and alerting so problems surface to you before they reach
  users. Covers structured logs with correlation IDs and sensible levels, error tracking (Sentry),
  product analytics (PostHog), and uptime alerting (BetterStack). Activates when the user mentions
  logging, missing logs, structured logs, correlation IDs, error tracking, Sentry/PostHog/BetterStack,
  monitoring, uptime, alerts, or "I only hear about crashes when a user emails me". Applies to any app
  with a backend that can fail server-side.
user-invokable: true
metadata:
  category: observability
---

# Observability & Monitoring

Generated apps tend to ship with the happy path and nothing to see by — no logs, no traces, no
breadcrumbs. Something breaks, you open the logs, and there's nothing there. The result is finding out
about an outage hours later from a support email instead of an alert. Reloading the page is not a way
to debug.

Skip for a purely static site. Otherwise, freedom: **medium** — adapt the tools to your stack.

## When to Use This Skill

- User says "there are no logs", "I can't tell what broke", or "it just stopped working".
- User hears about crashes from users, not from alerts.
- User mentions logging, structured logs, correlation IDs, or log levels.
- User mentions Sentry, PostHog, BetterStack, monitoring, uptime, or alerting.
- User is nearing launch with no error tracking.

## How It Works (about three tools, roughly an hour — no DevOps hire)

1. **Error tracking — Sentry.** The moment something throws, you get the stack trace, the release, and
   the affected user. Add this first; a page reload tells you none of that.
2. **Product analytics — PostHog.** See what users actually do and where they fall off.
3. **Uptime alerting — BetterStack.** Get paged when the app goes down instead of learning it later.
   Decide who is alerted and how.
4. **Make logs structured and searchable:**
   - log **objects**, not concatenated strings,
   - attach a **correlation ID** per request so one user's path is traceable across services,
   - use real **levels** (debug/info/warn/error) so the noise is filterable.
5. **Close the loop:** every production error should produce a log, an alert, and enough context to
   reproduce. If you can't answer "when did this start and who did it hit?", add more signal.

## Examples

### Example 1: "It broke and I have no idea why"
**Action**: Diagnose the missing telemetry; install the trio.
**Output**:
```
You're flying blind. Add (~1 hour):
1. Sentry — errors with stack traces + release/user context.
2. BetterStack — uptime alerts so a pager tells you, not a customer.
3. PostHog — see where users actually fail.
Then structure your logs: objects + correlation IDs + levels.
```

### Example 2: "I get a log line but can't follow one user's request"
**Action**: Add correlation IDs.
**Output**:
```
Stamp each request with a correlation_id and include it on every log object. Now a single user's
journey is searchable end-to-end, and the error events tie back to it.
```

## Do / Don't

- **Do** add error tracking and uptime alerting before launch — hear it from a pager, not a customer.
- **Do** log structured objects with correlation IDs and real levels.
- **Don't** lean on page reloads or unstructured console output.
- **Don't** launch blind; silent downtime is the default otherwise.
