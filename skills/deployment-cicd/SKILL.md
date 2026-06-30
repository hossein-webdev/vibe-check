---
name: deployment-cicd
description: >
  Turns risky, manual releases into boring, repeatable ones. Covers separate dev/staging/prod
  environments, a simple branching strategy, a CI/CD pipeline, safe-release techniques (canary,
  feature flags, one-click rollback), automated PR review, and choosing compute (Vercel/Railway/VPS).
  Activates when the user mentions deploying, shipping, staging, environments, branching, CI/CD,
  pipelines, canary releases, feature flags, rollback, testing in production, or hitting a function
  timeout. Applies to anything that gets redeployed; depth scales with team size.
user-invokable: true
metadata:
  category: deployment-cicd
---

# Deployment, CI/CD & Environments

When deploys are manual, the same push can behave differently each time — environment variables,
dependencies, and timing all drift. A lot of generated projects run dev, staging, and production from
one machine and test changes straight in production. The goal is to make releasing **boring**: small,
repeatable, and reversible.

Applies to almost every app; the depth scales with the team. Freedom: **medium** — adapt to your platform.

## When to Use This Skill

- User mentions deploying, shipping, releasing, or going live.
- User mentions environments, staging, branching, CI/CD, or pipelines.
- User mentions canary releases, feature flags, rollback, or testing in production.
- User hits a platform limit (e.g. a serverless function timeout) or "works locally, fails in CI".
- User pushes straight to the main branch with no safety net.

## How It Works

1. **Separate environments.** Stand up **dev / staging / production** (about half an hour): a branch
   strategy plus free preview/staging URLs. Stop testing changes in production.
2. **Keep branching simple.** `main` is always production; feature branches are short-lived; add
   staging/release branches only when you actually need them.
3. **Build a pipeline.** Without version control and automated tests you're releasing on hope. Automate
   **build → test/lint → deploy → rollback**, and keep it fast — a slow pipeline pushes teams to deploy
   rarely, so run tests and lint in parallel.
4. **Release safely:**
   - **canary** — ship to a small slice first, watch error rates, then promote (or auto-roll-back),
   - **feature flags** — turn things on/off without redeploying,
   - **one-click rollback** — a typo shouldn't take everyone down,
   - a short pre-release pass: secrets in place, fallbacks configured, output validated, **rollback tested**.
5. **Add automated PR review** — a tool like CodeRabbit or Sourcery, or a custom action that calls an
   LLM, gating merges to catch security/logic issues and reduce debt you don't fully understand.
6. **Match compute to the stage.** Free tiers have hard limits (for example, short serverless function
   timeouts) that block real work — move to a platform that fits, and split front-end from back-end when
   you outgrow it (costs: see `cost-infrastructure`).
7. **"Works locally, fails in CI"** usually comes down to three things: stale environment variables,
   mismatched database state, or timing/resource limits. Reconcile those.

## Examples

### Example 1: "I push to main and hope"
**Action**: Install the safety net.
**Output**:
```
Make releases boring:
1. Add a staging environment; keep main = production.
2. Pipeline: build → test/lint (parallel) → deploy → rollback.
3. Release with a canary + feature flags + one-click rollback.
4. Pre-release pass, including a tested rollback.
```

### Example 2: "My function keeps timing out at a few seconds"
**Action**: Platform fit, not a bug.
**Output**:
```
That's the free-tier function limit, not a bug. Move long/heavy work to a platform without that cap
(or to a background worker → scaling-performance), and split front-end from back-end.
```

## Do / Don't

- **Do** keep environments separate and `main` = production.
- **Do** release with a canary, feature flags, and a tested rollback.
- **Don't** test changes in production or tolerate a slow serial pipeline.
- **Don't** treat a free-tier limit as a bug — move to fitting compute.
