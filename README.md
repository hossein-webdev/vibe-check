# Vibe Check

**Your app runs. But does it survive real users?**

Vibe Check is a linter-grade production-readiness audit for vibe-coded (AI-generated) apps, packaged
as Claude Code skills. One adaptive `audit` profiles what your app actually *is* — then checks only
what applies, grades every area with cited evidence and stable rule IDs, computes a readiness score,
and hands you a prioritized gap table plus a detailed finding card for every gap.

No lectures, no one-size-fits-all checklist. A static landing page and a multi-tenant SaaS get very
different audits — and a mature codebase gets the green report it deserves.

## Install

```text
/plugin marketplace add hossein-webdev/vibe-check
/plugin install vibe-check@vibe-check-marketplace
```

Restart Claude Code (or run `/plugin`). Skills are namespaced under `vibe-check:`.

> Manual route: copy the folders in [`skills/`](skills/) into `~/.claude/skills/` or your project's
> `.claude/skills/`.

## What an audit looks like

```text
# Vibe Check — myapp
Profile:   Next.js · Postgres/Drizzle · OTP auth · AI workers · gateway payments · PaaS
Readiness: 74/100 (Risky) · 1×P1 · 1×P2 · 3×Verify · 1×Light · 3×N/A

## Gap table
| Section (skill)      | Status   | Rule      | What you're missing            | Priority | Evidence               |
|----------------------|----------|-----------|--------------------------------|----------|------------------------|
| monetization-pricing | 🔴 Gap   | PAY-04    | Callback returns 200 on failed charge | P1 | api/payments/callback.ts:88 |
| deployment-cicd      | 🟠 Gap   | DEPLOY-04 | `build` not run in CI          | P2       | .github/workflows/ci.yml |
| observability        | 🟢 Solid | —         | structured + correlated logs   | —        | platform/logger.ts:46  |
| auth-access          | ⚪ N/A   | —         | (no accounts in this app)      | —        | —                      |

## Findings
### [PAY-04] Failed charges acknowledged as success      Severity: P1 · Confidence: Confirmed
Where:    api/payments/callback.ts:88
Why it matters: the provider sees 200, never retries — failed payments vanish while dashboards stay green.
Fix (30 min): return non-2xx on failure OR push the raw event to a dead-letter queue; reconcile daily.
Verify:   simulate a failed charge → event lands in DLQ / provider retries; payments-per-hour alert fires.
```

Run it with `/vibe-check:audit` — or just say *"is my app ready to launch?"*.

A bundled static scanner ([`skills/audit/scripts/scan.mjs`](skills/audit/scripts/scan.mjs), Node ≥18,
zero deps, read-only) pre-collects the mechanical facts: tracked `.env` files, secret-pattern hits,
framework/DB/auth/AI/payment signals, CI/tests/migrations presence. The audit verifies every hit in
source before reporting — scanner facts, human-grade judgment.

## The skills (18)

| Skill | Covers | Rules |
|---|---|---|
| **`audit`** | Adaptive scored audit; routes to everything below | — |
| `production-readiness` | The last mile: 2-of-13-layers gap, owning AI code, docs, stage fit | PROD- |
| `app-security` | RLS, service-role bypass, deps, headers, XSS, monoculture, AI supply chain | SEC- |
| `secrets-management` | Client-exposed keys, hard-coding, vaults, rotation, git history | SEC-01..03 |
| `auth-access` | AuthN vs authZ, JWT, sessions, RBAC, tenant isolation, providers | AUTH- |
| `scaling-performance` | The scaling decision tree, pooling, caching, background jobs, query tuning | SCALE- |
| `data-architecture` | Schema, tenancy, migrations/backups, storage, ORM, CRDTs | DATA- |
| `database-selection` | Platform by workload: Neon/PlanetScale/D1/Supabase/Firebase/Convex + ceilings | DBS- |
| `ai-engineering` | Output validation, evals, non-deterministic CI, agents, memory, pgvector | AI- |
| `llm-cost-control` | The prompt bill: semantic caching, routing, spend caps, endpoint lockdown | LLM- |
| `observability` | Structured logs, error tracking, business-metric alerts, synthetics, DLQs | OBS- |
| `deployment-cicd` | Environments, pipelines that build, canary, flags, tested rollback | DEPLOY- |
| `reliability-recovery` | Graceful failure, timed restore drills, third-party resilience | REL- |
| `compliance-legal` | Privacy/terms, GDPR/CCPA, true deletion, SOC 2, app-store privacy | LEGAL- |
| `api-architecture` | Backend boundary, contracts, versioning, changelogs | API- |
| `frontend-mobile-quality` | Responsive, a11y, hostile-condition testing, deep links | FE- |
| `cost-infrastructure` | Bill attribution, cost per user, hosting by stage, self-host vs managed | COST- |
| `monetization-pricing` | Hosted checkout, webhook security, silent revenue loss, pricing structure | PAY- |

Every rule ID is defined once, in its owning skill, with a fix playbook. The audit cites the IDs;
re-audits diff against the saved report (`fixed / new / remaining` + score delta).

## Why "adaptive"?

The audit profiles first — backend or not, database or not, accounts, LLM calls, payments, mobile,
monorepo, hosting platform — and **skips what doesn't apply** instead of crying wolf. Detection is
evidence-based (dependency classes, config files, route shapes), with adaptive rules: serverless →
pooling/timeout emphasis; hand-rolled auth → strictest checks; client-side model call → automatic P1;
mature app → mostly-green is the correct answer.

## Contributing

Issues and PRs welcome. Keep skills focused and plain-spoken; follow the existing shape (frontmatter →
Rules → When to Use → How It Works → Fix playbook → Examples → Do/Don't); every rule needs an ID, a
failure severity, and a fix.

## License

[MIT](LICENSE)
