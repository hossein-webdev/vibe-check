<div align="center">

# 🩺 Vibe Check

### Your app runs. But does it survive real users?

**A linter-grade production-readiness audit for vibe-coded (AI-generated) apps — packaged as 24 Claude Code skills.**

[![Version](https://img.shields.io/badge/version-4.26.0-blue)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-24-8A2BE2)](#-the-skills)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](https://code.claude.com/docs/en/plugins)
[![Node](https://img.shields.io/badge/scanner-Node%20%E2%89%A518%2C%20zero%20deps-339933)](skills/audit/scripts/scan.mjs)

*AI tools get you an app that runs in a weekend. This gets it through its first thousand users.*

</div>

---

## Why

AI generators optimize for **"works on my screen"** — a front-end and a database. Production needs a
dozen more layers: security, auth, scaling, observability, deployment safety, recovery, compliance.
The gap is invisible until launch day, and then it's expensive.

**Vibe Check finds the gap before your users do:**

- 🧠 **Adaptive** — profiles what your app actually *is* and skips what doesn't apply. A landing page and a multi-tenant SaaS get different audits.
- 🔍 **Evidence-based** — every finding cites `file:line` and a stable rule ID, or it's downgraded to "verify". No vibes-based auditing.
- 🛠️ **Actionable** — every gap becomes a finding card with a time-boxed fix in real commands, and a verify step to prove it landed.
- 🟢 **Honest** — a mature codebase gets the green report it deserves. No manufactured nitpicks.

## Install

```text
/plugin marketplace add hossein-webdev/vibe-check
/plugin install vibe-check@vibe-check-marketplace
```

Restart Claude Code (or run `/plugin`). Skills live under the `vibe-check:` namespace.

<details>
<summary><b>Manual install</b> (no plugin system)</summary>

<br>

Copy the folders in [`skills/`](skills/) into `~/.claude/skills/` (global) or your project's
`.claude/skills/`. Each skill is a standalone `SKILL.md`.

</details>

## Use

```text
/vibe-check:audit
```

…or just talk: *"is my app ready to launch?"* · *"someone could steal my API keys?"* ·
*"it froze when 50 people signed up"* — the matching skill activates on its own.

### What you get back

```text
# Vibe Check — myapp
Profile:   Next.js · Postgres/Drizzle · OTP auth · AI workers · gateway payments · PaaS
Readiness: 74/100 (Risky) · 1×P1 · 1×P2 · 3×Verify · 1×Light · 3×N/A

## Gap table
| Section (skill)      | Status   | Rule      | What you're missing                   | Priority | Evidence                    |
|----------------------|----------|-----------|---------------------------------------|----------|-----------------------------|
| monetization-pricing | 🔴 Gap   | PAY-04    | Callback returns 200 on failed charge | P1       | api/payments/callback.ts:88 |
| deployment-cicd      | 🟠 Gap   | DEPLOY-04 | `build` not run in CI                 | P2       | .github/workflows/ci.yml    |
| observability        | 🟢 Solid | —         | structured + correlated logs          | —        | platform/logger.ts:46       |
| auth-access          | ⚪ N/A   | —         | (no accounts in this app)             | —        | —                           |

## Findings
### [PAY-04] Failed charges acknowledged as success      Severity: P1 · Confidence: Confirmed
Where:    api/payments/callback.ts:88
Why it matters: the provider sees 200, never retries — failed payments vanish while dashboards stay green.
Fix (30 min): return non-2xx on failure OR push the raw event to a dead-letter queue; reconcile daily.
Verify:   simulate a failed charge → event lands in DLQ / provider retries; payments-per-hour alert fires.

Bottom line: fix the webhook failure path first — it silently eats revenue.
```

Re-run after fixing and the report leads with the drift: `Fixed: 2 · New: 0 · Remaining: 1 · Score: 74 → 91`.

## How it works

```mermaid
flowchart LR
    A[📂 Your repo] --> B[scan.mjs<br/>static pre-scan]
    B --> C[🧠 Profile<br/>what IS this app?]
    C --> D{Area applies?}
    D -- no --> E[⚪ N/A<br/>skipped honestly]
    D -- yes --> F[Grade with<br/>rule IDs + evidence]
    F --> G[📊 Score /100<br/>gap table]
    G --> H[🗂️ Finding cards<br/>fix + verify steps]
    H --> I[Route to the<br/>owning skill]
```

1. **Scan** — a bundled [static scanner](skills/audit/scripts/scan.mjs) (Node ≥18, zero deps, read-only) collects the mechanical facts: tracked `.env` files, secret-pattern hits, framework/DB/auth/AI/payment dependency classes, routes, workers, CI, tests, migrations.
2. **Profile** — an aspect-detection matrix identifies rendering model, serverless, monorepo, auth style, where AI is called, hosting platform, maturity. Adaptive rules kick in: *serverless → pooling emphasis · monorepo → per-app audits · hand-rolled auth → strictest checks · client-side LLM call → automatic P1.*
3. **Grade** — every applicable area is checked against its skill's rules. Scanner output is treated as **facts, not findings** — each hit is verified in source before it's reported (a test-DB URL in CI is fine; a live key in a component is not).
4. **Report** — readiness score, prioritized gap table, and a detailed finding card per gap.

### Scoring

| Score | Band | Meaning |
|:---:|:---:|---|
| 80–100 | 🟢 **Solid** | Ship — keep the verify list |
| 50–79 | 🟠 **Risky** | Fix P1/P2 before real users or money |
| 0–49 | 🔴 **Ship-blocker** | Do not launch until P1s are closed |

*P1 −25 · P2 −10 · Verify −3 · Light −1, from 100. P1 = leaks data, loses money, bypasses auth, or loses data.*

## 🧰 The skills

The `audit` router + 23 focused skills. Every rule ID is defined once, in its owning skill, with a
fix playbook — the audit cites them; you can also invoke any skill directly (`/vibe-check:app-security`).

| Skill | Covers | Rules |
|---|---|:---:|
| 🩺 **[`audit`](skills/audit/SKILL.md)** | The scored, adaptive audit — start here | — |
| 🏁 [`production-readiness`](skills/production-readiness/SKILL.md) | The last mile: owning AI code, cross-model review, feature health, pre-release audit gate | `PROD` |
| 🛡️ [`app-security`](skills/app-security/SKILL.md) | RLS, injection (SQL/XSS/shell), supply chain, CSRF, SSRF, host hardening, unbypassable edge | `SEC` |
| 🔑 [`secrets-management`](skills/secrets-management/SKILL.md) | Client-exposed keys, vaults, rotation, git history, commit-time blocking | `SEC-01..03`, `SEC-12` |
| 🚪 [`auth-access`](skills/auth-access/SKILL.md) | AuthN ≠ authZ, JWT, sessions, RBAC, tenant isolation, admin surfaces, context-aware access | `AUTH` |
| 📈 [`scaling-performance`](skills/scaling-performance/SKILL.md) | Pooling, caching layers, read replicas + consistency, background jobs, query tuning | `SCALE` |
| 🗄️ [`data-architecture`](skills/data-architecture/SKILL.md) | Schema, tenancy without forks or schema pollution, zero-downtime migrations, backups, storage | `DATA` |
| ⚖️ [`database-selection`](skills/database-selection/SKILL.md) | Platform by workload: Neon / PlanetScale / D1 / Supabase / Firebase / Convex | `DBS` |
| 🤖 [`ai-engineering`](skills/ai-engineering/SKILL.md) | Output validation, evals, non-determinism in CI, RAG + AI-feature data boundaries | `AI` |
| 🕹️ [`agent-operations`](skills/agent-operations/SKILL.md) | Agents that act: memory, topology, long runs, tool surface, config freshness, guardrails | `AI-05/06/08..11` |
| 💸 [`llm-cost-control`](skills/llm-cost-control/SKILL.md) | Semantic + prompt caching, model routing, spend caps, endpoint lockdown | `LLM` |
| 📡 [`observability`](skills/observability/SKILL.md) | Structured logs, error tracking, SLOs + burn rate, incident cost, audit trails | `OBS` |
| 🚀 [`deployment-cicd`](skills/deployment-cicd/SKILL.md) | Environments, branch protection, CI gates, canary/rollback, runbooks | `DEPLOY` |
| 🧯 [`reliability-recovery`](skills/reliability-recovery/SKILL.md) | Graceful failure, tested restores, circuit breakers, bulkheads, incident comms | `REL` |
| 📜 [`compliance-legal`](skills/compliance-legal/SKILL.md) | Privacy/terms, GDPR/CCPA, true deletion, SOC 2, AI disclosure, accessibility + jurisdiction | `LEGAL` |
| 🧱 [`api-architecture`](skills/api-architecture/SKILL.md) | Backend boundary, contracts, versioning, layered rate limiting | `API` |
| ✏️ [`api-design`](skills/api-design/SKILL.md) | Naming, status codes, errors, pagination, versioning, idempotency, signing, GraphQL limits | `APID` |
| 📱 [`frontend-mobile-quality`](skills/frontend-mobile-quality/SKILL.md) | Responsive, WCAG AA a11y, hostile-condition testing, deep links, native-shell hardening | `FE` |
| 💰 [`cost-infrastructure`](skills/cost-infrastructure/SKILL.md) | Bill attribution, unit economics, custom-work pricing, vendor commitments, hosting by stage | `COST` |
| 🧾 [`monetization-pricing`](skills/monetization-pricing/SKILL.md) | Hosted checkout, webhook security, silent revenue loss, pricing, ICP, agent buyers | `PAY` |
| 🎲 [`business-logic-abuse`](skills/business-logic-abuse/SKILL.md) | Client-set prices, promo farming, quota bypass, races, workflow and ownership edges | `BIZ` |
| ⛓️ [`solidity-security`](skills/solidity-security/SKILL.md) | Smart-contract audit: reentrancy, oracle manipulation, proxy safety, token integration | `SOL` |
| 🧪 [`test-quality`](skills/test-quality/SKILL.md) | Tests that catch bugs: anti-fragility, mocking discipline, fixed vectors, coverage as a floor | `TEST` |
| 📈 [`growth-activation`](skills/growth-activation/SKILL.md) | Audience before launch, validated scope, funnel instrumentation, activation, onboarding arc, cohort retention | `GROW` |

<details>
<summary><b>Example rules</b> — the kind of thing the audit catches</summary>

<br>

| Rule | The trap |
|---|---|
| `SEC-02` | Your API key is in the front-end bundle — every visitor already has it |
| `PAY-04` | Webhook returns `200` on a failed charge — provider never retries, revenue vanishes silently |
| `SCALE-01` | 50 sign-ups = 50 DB connections = lockup; a pooler fixes it for $0 (a replica costs 100× and doesn't) |
| `AUTH-05` | Login works, but user A can fetch user B's record by id — untested = broken |
| `OBS-09` | Your server reports "healthy" while users in another region can't reach it — outside-in checks only |
| `REL-05` | The generator never raises backup strategy on its own: one DB, one region, no tested restore |
| `LLM-06` | A model call in client code publishes your key *and* your wallet |
| `DEPLOY-08` | "Serverless scales automatically" — within plan ceilings you never read, found on launch day |
| `GROW-07` | Total users only goes up — the dashboard stays green while every cohort quietly stops returning |
| `SEC-14` | Your WAF is perfect and your origin IP is in public DNS history — attackers just skip it |
| `REL-08` | One hung webhook drains the shared connection pool and takes login and checkout with it |
| `SCALE-08` | The save worked — the read came off a replica three seconds behind and showed the old value |
| `COST-08` | Eighteen months of yes: annual maintenance on one client's custom feature now exceeds their contract |
| `FE-09` | Wrapping the web app as a native app moved your API keys onto a device you don't control |
| `SEC-16` | Your agent fetches user URLs from inside the firewall — that's a proxy to your admin panel |
| `AI-13` | "Ignore your previous instructions" works because authorization lived in the prompt |
| `AUTH-13` | `/admin` has no login because the generator assumed only you would know the URL |
| `BIZ-04` | Read-then-write on a balance: two requests at once spend the same credit twice |
| `SEC-08` | One search box built by string interpolation returns every user's row |
| `AUTH-14` | Your login page reflects `?next=` — so it will forward your users to a phishing site |
| `SEC-18` | The chat widget on your login page can read every password typed into it |
| `AI-11` | A human approving agent actions isn't a guardrail — scoped credentials and deny-by-default gates are |

</details>

## Contributing

Issues and PRs welcome. House style:

- One focused skill per concern; plain language over jargon.
- Follow the shape: `frontmatter → Rules → When to Use → How It Works → Fix playbook → Examples → Do/Don't`.
- Every rule gets a stable ID, a severity-if-failed, and a paste-able fix.
- The audit spec lives in [`skills/audit/reference.md`](skills/audit/reference.md) — finding-card format, detection matrix, scoring.

## Credits

The [`test-quality`](skills/test-quality/SKILL.md) rubric is adapted from
**[beyond-test-coverage](https://github.com/rollinsio/beyond-test-coverage)** by
**Michael Rollins** (MIT) — a benchmark showing that LLM-generated test suites judged on quality
axes beat suites optimized for coverage percentage. Worth reading in full if you care about tests.

`solidity-security` (SOL-01..10) was contributed by [@holistis](https://github.com/holistis).

[`business-logic-abuse`](skills/business-logic-abuse/SKILL.md) exists because
**[pre-production-checklist](https://github.com/FarzamHabibi/pre-production-checklist)** by
**Farzam Habibi** ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)) mapped the abuse and
race-condition ground this pack had left uncovered. The rules here are written from scratch in this
pack's own format; that checklist is where the gap was identified, and it's worth reading directly
if you want exhaustive item-level coverage rather than diagnosed rules.

## License

[MIT](LICENSE) — use it, fork it, sell it, ship safer apps. Attribution appreciated.

<div align="center">
<sub>Built for the era where anyone can generate an app — and everyone still has to run one.</sub>
</div>
