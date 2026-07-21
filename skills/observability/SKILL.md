---
name: observability
description: >
  Adds logging, error tracking, monitoring, and alerting so problems surface to you before they
  reach users — including the failures your code doesn't know about: business-metric alerting,
  synthetic transactions, and dead-letter queues for webhooks that returned 200 but failed. Covers
  structured logs with correlation IDs and levels, error tracking (Sentry), product analytics
  (PostHog), and uptime alerting (BetterStack). Activates when the user mentions logging, missing
  logs, structured logs, correlation IDs, error tracking, Sentry/PostHog/BetterStack, monitoring,
  uptime, alerts, silent failures, or "I only hear about crashes when a user emails me". Applies to
  any app with a backend that can fail server-side.
user-invokable: true
metadata:
  category: observability
  version: "2.0.0"
---

# Observability & Monitoring

Generated apps ship the happy path and nothing to see by — no logs, no traces, no breadcrumbs.
Something breaks, you open the logs, there's nothing there, and you learn about the 2am outage from
a 9am support email. And the costliest failures are the ones your code never threw: dashboards green,
revenue gone. Instrument for both.

The number that prices all of this is the **discovery gap** — the time between a failure starting
and you knowing. At 60 seconds the blast radius is a few transactions and a quick apology; at six
hours it's the day's revenue, refund fees on money you never received, support hours, and the trust
cost (a meaningful share of customers who hit a payment issue never come back — and the ones who
complain tell others). Monitoring isn't a dashboard; it's the distance between something breaking
and you knowing about it.

Skip for a purely static site. Freedom: **medium** — adapt tools to the stack.

## Rules

| ID | Check | If it fails |
|---|---|---|
| OBS-01 | Error tracking wired (Sentry or equivalent) with release/user context | P1 near launch |
| OBS-02 | Uptime alerting pages a human (BetterStack or equivalent) | P2 |
| OBS-03 | Logs are structured objects, not concatenated strings | P2 |
| OBS-04 | Correlation ID per request, attached to every log line | P2 |
| OBS-05 | Disciplined log levels (debug/info/warn/error) | P3 |
| OBS-06 | Business-metric alerting (payments/signups/checkouts per hour) | P2 (P1 if revenue flows) |
| OBS-07 | Synthetic transaction runs the critical path every few minutes | P3 |
| OBS-08 | Dead-letter queue captures events that returned 200 but failed | P2 (P1 for payment webhooks) |
| OBS-09 | Outside-in health checks from multiple regions (not server self-report) | P2 |
| OBS-10 | Logs + metrics + traces correlated by request id (OpenTelemetry) — full trace in <60s | P3 |
| OBS-11 | SLOs defined with an error budget that gates release pace | P3 (P2 at scale) |
| OBS-12 | Session replays wired to error events; rage-clicks flagged as UX failures | P3 |
| OBS-13 | Support tickets triaged by root cause weekly; repeated causes escalate to engineering | P3 |

## When to Use This Skill

- User says "there are no logs", "I can't tell what broke", or "it just stopped working".
- User hears about crashes from users, not alerts — or reports "dashboards green, revenue down".
- User mentions logging, structured logs, correlation IDs, log levels, or silent failures.
- User mentions Sentry, PostHog, BetterStack, monitoring, uptime, alerting, or DLQs.

## How It Works

### Layer 1 — see the errors your code throws (~3 tools, ~1 hour)
1. **Error tracking — Sentry (OBS-01).** Stack trace, release, affected user, the moment it throws.
2. **Product analytics — PostHog.** What users do, where they fall off.
3. **Uptime alerting — BetterStack (OBS-02).** A pager tells you, not a customer. Decide who's paged.

### Layer 2 — make logs answer questions (OBS-03..05)
- Log **objects**, not strings; attach a **correlation ID** per request so one user's path is
  traceable end-to-end; use real **levels** so noise filters out.
- Close the loop: every production error yields a log + an alert + enough context to reproduce.
  If you can't answer "when did it start and who did it hit?", add signal.

### Layer 3 — catch the failures your code doesn't know about (OBS-06..08)
Error trackers only see thrown errors. A handler that catches, swallows, and returns success keeps
every dashboard green while money leaks:
- **Business-metric alerting (OBS-06):** track payments/signups/checkouts **per hour**; alert on
  those. Signups normal + payments zero = healthy server, bleeding business.
- **Synthetic transactions (OBS-07):** run signup → cart → checkout → pay → confirm automatically
  every few minutes; a broken step pages you before customers hit it.
- **Dead-letter queue (OBS-08):** when an event returns `200` but the business logic failed, a DLQ
  keeps it waiting for you instead of vanishing into a success response (pairs with
  `monetization-pricing` PAY-04).

### Layer 4 — monitoring that isn't theater (OBS-09..11)

The "we have monitoring" test is three questions; most rooms go quiet on all three:

1. **"If the app goes down right now, how do you find out?" (OBS-09).** If the answer is a customer
   email, that's alert theater. Real monitoring is **outside-in**: external health checks from
   **multiple regions** — a server asking itself "am I OK?" will report healthy while users in
   another region can't reach it.
2. **"Can you trace one failing request in under 60 seconds?" (OBS-10).** Teams have logs, metrics,
   and dashboards — unconnected. The three pillars only work **correlated by a request id**: the log
   says *what*, the metric says *how often*, the trace says *where*. **OpenTelemetry** is the
   vendor-neutral protocol that ties them across services — instrumentation you keep when you switch
   vendors.
3. **"Do you have SLOs?" (OBS-11).** "99% uptime" sounds great until you do the math: **3 days 15
   hours down per year**. 99.9% = 8h45m; 99.99% = 52 minutes. SLOs turn vague expectations into
   commitments with an **error budget**: budget burning → slow releases; budget healthy → ship fast.

Monitoring is not a dashboard you built — it's a system that calls *you*.

### Layer 5 — watch what users experienced (OBS-12)

"Everything stopped working" is a cry for help, not a bug report. Stop asking users to describe
bugs — watch what happened:
1. **Session replays** — every click, scroll, and error recorded; when a bug report arrives you
   watch the session instead of interrogating the reporter.
2. **Wire replays to error tracking** — an exception in Sentry carries its replay automatically:
   the error and the user experience that caused it, side by side, no reproducing.
3. **Flag rage clicks** — the same button hit seven times in three seconds is a stuck user; surface
   it as a UX failure *before* it becomes a support ticket.

### Layer 6 — the support inbox is a monitoring tool (OBS-13)

Dashboards track **server** health; the support inbox tracks **user** health — it's the only signal
that captures what users actually experienced. Twelve "something's wrong with my account" tickets
against a green 99%-uptime dashboard is a bug report, not a service queue:
1. **Categorize every ticket by root cause, not symptom.** The same cause three times in a week is
   a product bug that needs an engineering fix, not a support macro.
2. **Three buckets, three owners:** *user error* → UX/onboarding fix; *platform error* (users see
   it, monitoring can't) → an observability gap — add that monitor; *business-logic error* (the
   code did exactly what it was told; the design was wrong) → the hardest, because nothing ever
   threw.
3. **Weekly 30-minute review:** group the last 7 days by root cause — five "wrong dashboard data"
   tickets point at caching; three "payment failed" tickets point at a webhook returning 200
   (PAY-04). Read it like a dashboard, treat it like a task list.

## Fix playbook

```text
Flying blind [OBS-01..03] (~1 hour):
 1. npx @sentry/wizard@latest -i nextjs   (or platform equivalent)
 2. BetterStack monitor on / + status page; page on 2 consecutive fails.
 3. Structured logger (pino): logger.info({orderId, userId}, "order created")
Can't trace one user's request [OBS-04]:
 1. Middleware mints/propagates x-request-id; include it on every log object + response header.
Silent revenue failure [OBS-06/08]:
 1. Emit business events (payment_succeeded, signup) → per-hour counters → alert on deltas.
 2. Wrap webhook handlers: catch → push raw event to DLQ table/queue → alert on DLQ depth > 0.
```

## Examples

### Example 1: "It broke and I have no idea why"
**Output**:
```
[OBS-01/02] Sentry + BetterStack today (~1h), PostHog for behavior.
[OBS-03/04] Structured logs + correlation IDs so the next incident is greppable end-to-end.
```

### Example 2: "Dashboards were green but revenue dropped 40%"
**Output**:
```
Classic silent failure — nothing threw. [OBS-06] alert on payments/hour, [OBS-07] synthetic
checkout every 5 min, [OBS-08] DLQ so a 200-but-failed webhook waits for you instead of vanishing.
```

## Do / Don't

- **Do** wire error tracking + uptime paging before launch; structure logs with correlation IDs.
- **Do** monitor business metrics — the server being healthy doesn't mean the business is.
- **Do** check health from outside, multiple regions — self-reports lie.
- **Don't** rely on page reloads or unstructured console output.
- **Don't** assume no errors = no failures; the expensive ones never throw.
- **Don't** quote "99% uptime" without doing the math (that's 3.6 days a year down).

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
