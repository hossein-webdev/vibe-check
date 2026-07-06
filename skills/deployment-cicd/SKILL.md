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
  version: "2.0.0"
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

## When to Use This Skill

- User mentions deploying, shipping, releasing, environments, staging, branching, CI/CD.
- User mentions canary, feature flags, rollback, or testing in production.
- User hits a platform limit (function timeout) or "works locally, fails in CI".
- User pushes straight to main with no safety net.

## How It Works

1. **Separate environments (DEPLOY-01).** Dev / staging / prod in ~30 min: branch strategy + free
   preview URLs. Stop testing in production.
2. **Simple branching (DEPLOY-02).** `main` is always production; feature branches are short-lived;
   add staging/release branches only when genuinely needed.
3. **A pipeline that builds (DEPLOY-03/04).** Automate build → test/lint → deploy → rollback. Run
   the **production build in CI** — "we build locally before pushing" is honor-based, and a broken
   build reaching `main` blocks everyone. Keep it fast (DEPLOY-07): parallelize test/lint; a 45-min
   pipeline trains teams to deploy weekly.
4. **Release safely (DEPLOY-05/06).** Canary to a small slice, watch error rates, then promote (or
   auto-rollback). Feature flags toggle behavior without redeploys. **Test the rollback** — a typo
   shouldn't take everyone down while you google the undo.
5. **Automated PR review (DEPLOY-09).** CodeRabbit / Sourcery / a custom LLM action, gating merges —
   catches security/logic issues and the tech debt you don't fully understand.
6. **Compute fits the stage (DEPLOY-08).** "Serverless scales automatically" — *within the plan
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
7. **"Works locally, fails in CI"** = stale env vars, mismatched DB state, or timing/resource
   limits. Reconcile those three before blaming the tests.
8. **Mind the CI quota trapdoor (DEPLOY-10).** Free CI minutes cover a solo project; add a teammate,
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
- **Don't** test features in production or accept a serial 45-minute pipeline.
- **Don't** fight a free-tier timeout — graduate the compute.
