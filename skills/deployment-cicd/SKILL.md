---
name: deployment-cicd
description: >
  Turns risky, manual releases into boring, repeatable ones. Covers separate dev/staging/prod
  environments, a simple branching strategy, a CI/CD pipeline that actually builds, safe-release
  techniques (canary, feature flags, one-click rollback), automated PR review, and choosing compute
  (Vercel/Railway/VPS). Activates when the user mentions deploying, shipping, staging, environments,
  branching, CI/CD, pipelines, canary releases, feature flags, rollback, testing in production, or
  hitting a function timeout. Applies to anything that gets redeployed; depth scales with team size.
user-invokable: true
metadata:
  category: deployment-cicd
  version: "2.1.0"
---

# Deployment, CI/CD & Environments

When deploys are manual, the same push behaves differently each time — env vars, dependencies, and
timing drift. Many generated projects run everything from one machine and test changes in
production. The goal is releases so boring they're forgettable: small, repeatable, reversible.

Freedom: **medium** — adapt to the platform; depth scales with team.

## Rules

| ID | Check | If it fails |
|---|---|---|
| DEPLOY-01 | Separate dev / staging / prod environments exist | P2 |
| DEPLOY-02 | `main` = production; short-lived feature branches | P3 |
| DEPLOY-03 | CI runs tests + lint on every push/PR | P2 |
| DEPLOY-04 | CI runs the production **build** (broken builds can't reach main) | P2 |
| DEPLOY-05 | Releases use canary and/or feature flags (no big-bang) | P2 at scale |
| DEPLOY-06 | One-click rollback exists and has been **tested** | P1 near launch |
| DEPLOY-07 | Pipeline fast enough to deploy often (parallel test/lint) | P3 |
| DEPLOY-08 | Compute fits the workload (no free-tier timeout fights) | P2 |
| DEPLOY-09 | Automated PR review gate (CodeRabbit/Sourcery/LLM action) | P3 |
| DEPLOY-10 | CI quota managed: usage alert at ~75%, path-based conditional pipelines, self-hosted-runner escape hatch | P2 for teams |
| DEPLOY-11 | Runbooks exist per failure scenario; rollback is automated on degraded metrics, not manual | P2 near launch |
| DEPLOY-12 | Branch protection **enforced** on `main`: direct pushes rejected, PR + review required, checks required to merge — and changes small enough to bisect | P1 once anything reaches real users |

## When to Use This Skill

- User mentions deploying, shipping, releasing, environments, staging, branching, CI/CD.
- User mentions canary, feature flags, rollback, or testing in production.
- User hits a platform limit (function timeout) or "works locally, fails in CI".
- User pushes straight to main with no safety net.

## How It Works

1. **Separate environments (DEPLOY-01).** Dev / staging / prod in ~30 min: branch strategy + free
   preview URLs. Stop testing in production. Staging only counts if it **mirrors production** —
   same schema, same services, same environment variables (a staging that differs is a rehearsal
   on the wrong stage). Gate on it: tests run against staging, **pass = automatic promotion,
   fail = production never sees it**. The failure mode to look for: dev and prod sharing **one
   database, one set of API keys, one config** — test accounts sitting in the same tables as paying
   customers, and one careless query in development felt instantly by real users. A generator won't
   distinguish test from live unless told to.
2. **Simple branching (DEPLOY-02).** `main` is always production; feature branches are short-lived;
   add staging/release branches only when genuinely needed.
3. **A pipeline that builds (DEPLOY-03/04).** Automate build → test/lint → deploy → rollback. Run
   the **production build in CI** — "we build locally before pushing" is honor-based, and a broken
   build reaching `main` blocks everyone. Keep it fast (DEPLOY-07): parallelize test/lint; a 45-min
   pipeline trains teams to deploy weekly.
4. **Make the gate real (DEPLOY-12).** Having CI configured is not the same as having merges
   blocked. The failure looks like this: forty-seven files land on `main` in one commit, no pull
   request, no review, no checks — and at 6pm on a Friday the payment flow stops, with no way to
   tell which of the forty-seven did it while chargebacks arrive. A generator treats the repository
   as a filing cabinet unless it's told otherwise:
   - **Reject direct pushes to `main` — for everyone**, including you, including automation. Turn on
     branch protection so every change arrives as a pull request. This is the one setting that makes
     DEPLOY-02..04 actually binding rather than a convention.
   - **Require the checks to pass before merge**, not merely to run. Tests, lint, the production
     build, and your security scan gate the button; a failing check blocks it. The one file that
     broke checkout gets caught before it reaches a customer rather than after.
   - **Require a review** — at least one approval, and for a solo builder a self-review pass over
     the diff is still worth its minute. The pull request is where *what changed and why* gets
     recorded, which is what you'll read during the next incident.
   - **Keep changes small enough to trace and revert.** One concern per pull request. A 47-file
     commit can't be bisected or rolled back surgically; a scoped one is reverted in seconds. This is
     what makes DEPLOY-06's rollback usable in practice instead of theoretical.
5. **Release safely (DEPLOY-05/06/11).** The test of your deploy architecture: *what could go wrong
   that you couldn't fix remotely in 30 minutes?* (Fear of Friday deploys is an architecture
   confession, not a scheduling preference.)
   - **Feature flags decouple deploying from releasing** — deployment is a technical event, release
     is a business decision. Ship dark, enable for 5%, flip the flag on trouble: no rollback, no
     redeploy, one toggle.
   - **Canary with automatic shift-back** — 5% of traffic on the new version, monitoring watching
     error rates/latency; on degradation, traffic shifts back **automatically**. No humans in the
     loop at 2am.
   - **Automated rollback (DEPLOY-11)** — "someone remotes in and reverts manually" is a prayer,
     not a plan. The system detects the failure, halts the rollout, reverts to last-known-good.
     **Test the rollback** either way — a typo shouldn't take everyone down while you google the undo.
   - **Runbooks (DEPLOY-11)** — a step-by-step guide per failure scenario, written in daylight.
     Judgment at 3am is unreliable; process isn't.
6. **Automated PR review (DEPLOY-09).** CodeRabbit / Sourcery / a custom LLM action, gating merges —
   catches security/logic issues and the tech debt you don't fully understand.
7. **Compute fits the stage (DEPLOY-08).** "Serverless scales automatically" — *within the plan
   boundaries you never read*, and you find them on launch day. Read the ceilings **before** you
   need them:
   - **concurrency caps** — hobby tiers allow ~10 concurrent executions: the 11th cold-starts, the
     50th errors, precisely when traffic spikes;
   - **execution time** — e.g. 10 s hobby / 60 s pro, while an AI feature needs 15–20 s;
   - **bandwidth caps** — 100 GB disappears in a week for an image-heavy app;
   - **function size** — a bundle over the ~50 MB ceiling can fail the deploy *silently*.
   Every platform (Vercel, Netlify, Lambda, Cloudflare Workers) markets infinite scale and has
   different walls. Long/heavy work → a platform without the cap, or a background worker
   (→ `scaling-performance`); split front-end from back-end when you outgrow one box.
8. **"Works locally, fails in CI"** = stale env vars, mismatched DB state, or timing/resource
   limits. Reconcile those three before blaming the tests.
9. **Mind the CI quota trapdoor (DEPLOY-10).** Free CI minutes cover a solo project; add a teammate,
   integration tests, and a staging step and usage multiplies — the allocation dies **mid-sprint**,
   the pipeline stops, code ships untested, and overage pricing turns a free tool into a four-figure
   bill. Every CI platform has a free tier and a trapdoor under it:
   - **alert at ~75%** of the monthly allocation (check usage weekly) — an alert buys time, a
     stopped pipeline buys none;
   - **path-based conditional pipelines** — a README change doesn't need integration tests; run only
     the stages matching the changed files (full-suite-on-every-push is wasteful, not thorough);
   - **self-hosted runners** as the escape hatch — a ~$20/month box runs unlimited minutes (you
     manage it), versus paying per-minute overage.

## Fix playbook

```text
Everything goes straight to main [DEPLOY-12]:
 1. Repo settings -> branch protection on `main`: block direct pushes (include admins), require a PR.
 2. Require status checks to PASS before merge: test, lint, production build, security scan.
 3. Require 1 approval (solo: a self-review pass over the diff still catches things).
 4. Going forward: one concern per PR. A 47-file commit cannot be bisected or reverted cleanly.
```

```yaml
# DEPLOY-04: make CI build (GitHub Actions step)
- run: npm ci
- run: npm run lint & npm run typecheck & wait   # DEPLOY-07 parallel
- run: npm test
- run: npm run build                              # the missing step
```
```text
No rollback [DEPLOY-06]:
 1. Platform: enable instant rollback (Vercel/Railway keep prior deploys) — find the button NOW.
 2. Drill it once on staging; write the two-line runbook where the team will find it at 2am.
Big-bang releases [DEPLOY-05]:
 1. Add a flags lib (or env-var flags to start); ship dark, enable for 5%, watch, widen.
```

## Examples

### Example 1: "I push to main and hope"
**Output**:
```
[DEPLOY-01] staging via preview URLs · [DEPLOY-03/04] CI: lint+test+BUILD · [DEPLOY-05/06] canary
+ flags + a rollback you've actually tested. Releases should be boring.
```

### Example 2: "My function times out at 10 seconds"
**Output**:
```
[DEPLOY-08] That's the platform ceiling, not a bug. Move long work to a worker/other compute
(Railway/Render/Fly), split front-end from back-end. Free tier is training wheels.
```

## Do / Don't

- **Do** keep main = production, run the build in CI, and test the rollback.
- **Do** release with canary + flags once real users exist.
- **Do** enforce branch protection — CI that runs but can't block a merge is decoration.
- **Don't** test features in production or accept a serial 45-minute pipeline.
- **Don't** fight a free-tier timeout — graduate the compute.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
