---
name: audit
description: >
  Runs an adaptive, evidence-based production-readiness audit on a vibe-coded (AI-generated) app.
  It profiles the project from its code (optionally via a bundled static scanner), checks only the
  areas that apply, grades each with cited evidence and stable rule IDs, computes a readiness score,
  and outputs a prioritized gap table plus a detailed finding card for every gap (what, why it
  matters, exact fix commands, how to verify). Use this first when the user wants to ship/launch,
  asks "is my app production-ready / what am I missing", has a demo that breaks with real users, or
  is hardening something built with Lovable, Cursor, Bolt, v0, Replit, or similar. Routes gaps to
  production-readiness, app-security, secrets-management, auth-access, scaling-performance,
  data-architecture, database-selection, ai-engineering, llm-cost-control, observability,
  deployment-cicd, reliability-recovery, compliance-legal, api-architecture, api-design,
  frontend-mobile-quality, cost-infrastructure, and monetization-pricing.
user-invokable: true
metadata:
  category: production-readiness
  role: router
  version: "2.0.0"
---

# Vibe Check — Production Readiness Audit

AI tools get you something that *runs* fast; "runs on my screen" and "survives real users" are
different bars. This audit finds the gap — **adaptively** (only what applies), **accurately** (every
claim cites evidence or is downgraded to "verify"), and **actionably** (every gap becomes a finding
card with exact fix commands). Detailed specs live in [reference.md](reference.md).

## When to Use This Skill

- User wants to "ship", "launch", "go live", or asks "is this production-ready?".
- User asks "what am I missing before launch?".
- A working demo "falls apart when real people use it".
- User is hardening an app from Lovable, Cursor, Bolt, v0, Replit, etc.
- User says "it works, but…" (slow, insecure, crashes, no logs, scary bill).

## How It Works

### Step 1 — Scan, then profile

Run the bundled scanner first (read-only, zero deps, Node ≥18):

```
node <plugin-dir>/skills/audit/scripts/scan.mjs <project-dir>
```

It emits JSON facts: tracked `.env` files, secret-pattern hits (with false positives — you judge),
framework/hosting/DB/auth/AI/payments/queue/mobile dependency classes, API/webhook/worker routes,
CI/tests/migrations presence, RLS and header mentions. If Node is unavailable, run the same checks
manually — the full signal list is in [reference.md §2](reference.md).

Then complete the profile with the **aspect-detection matrix** (reference.md §2): rendering model,
serverless, monorepo, auth style (provider vs hand-rolled), where AI is called, hosting platform,
maturity. Ask the user only what code can't reveal (realistic traffic, enterprise/app-store plans).

**Scanner output is facts, not findings** — open every hit before carding it (reference.md §5). An
untracked `.env` on disk is hygiene; a tracked one is a P1. A test-DB URL in CI is fine; a live key
in a component is not.

### Step 2 — Select applicable areas

| Area | Applies when… | Route to |
|---|---|---|
| Code ownership & launch gaps | Always (any AI-built app) | `production-readiness` |
| Security posture | Always | `app-security` |
| Secrets & keys | Always | `secrets-management` |
| Auth & access control | Accounts / protected data exist | `auth-access` |
| Data & schema | There's a database | `data-architecture` |
| Choosing/fitting the database | DB choice in question, or workload-fit doubts | `database-selection` |
| Scaling & performance | Backend/DB **and** real traffic expected | `scaling-performance` |
| AI / LLM engineering | The app calls an LLM | `ai-engineering` |
| LLM cost control | The app calls a paid model API | `llm-cost-control` |
| Observability | There's a backend that can fail | `observability` |
| Deployment & CI/CD | Anything you redeploy | `deployment-cicd` |
| Reliability & recovery | User data held or uptime promised | `reliability-recovery` |
| Compliance & legal | Personal data / B2B / app store | `compliance-legal` |
| API & backend boundary | A backend/API the client calls | `api-architecture` |
| API surface design | Endpoints consumed by clients/partners (naming, codes, pagination, versioning) | `api-design` |
| Smart-contract security | The app includes Solidity / EVM smart contracts | `solidity-security` |
| Frontend & mobile quality | There's a UI (deep links only if mobile) | `frontend-mobile-quality` |
| Cost & infrastructure | Infra usage is non-trivial | `cost-infrastructure` |
| Monetization & billing | The app charges money | `monetization-pricing` |

Skipping is a real result — mark ⚪ N/A with a one-word reason. Never pad.

**Adaptive rules** (full list in reference.md §3): serverless → timeout/pooling emphasis · monorepo →
per-app tables · hand-rolled auth → strictest auth checks · client-side AI call → automatic P1 ·
SPA → "everything in the bundle is public" is the headline check · payments → read webhook handlers
line-by-line · mature app → mostly-green output is correct, don't manufacture nitpicks.

### Step 3 — Grade with rule IDs

Statuses: 🟢 Solid · 🔴 Gap P1 · 🟠 Gap P2 · 🔎 Verify · 🟡 Light P3 · ⚪ N/A.
**Priority = blast radius**: P1 leaks data / loses money / bypasses auth / loses data; P2 breaks at
scale or blocks a deal or is a known CVE; P3 is polish. Every check cites its **rule ID** — each
domain skill defines its rules in a `## Rules` table (namespaces in reference.md §6). If you didn't
see it in the code, it's 🔎 Verify, never 🔴.

### Step 4 — Score

Start 100; deduct P1 −25 · P2 −10 · Verify −3 · Light −1; floor 0.
Bands: ≥80 🟢 Solid · 50–79 🟠 Risky · <50 🔴 Ship-blocker.

### Step 5 — Output (required format)

```
# Vibe Check — <app>
Profile:   <stack · db · auth · ai · payments · hosting · scale intent>
Readiness: <n>/100 (<band>) · <k>×P1 · <k>×P2 · <k>×Verify · <k>×Light · <k>×N/A

## Gap table
| Section (skill) | Status | Rule | What you're missing / must do | Priority | Evidence |
|---|---|---|---|---|---|
... one row per area, sorted P1 → P2 → P3 → Verify → Solid → N/A ...

## Findings
### [SEC-01] <title>    Severity: P1 · Confidence: Confirmed
Where / What / Why it matters / Fix (time-boxed, real commands) / Verify / Routes to
... one card per non-green row (spec: reference.md §1) ...

Bottom line: <one sentence — the single most important fix>.
```

Offer to save the report as `vibe-check-report.md` in the project. On a **re-audit**, read the prior
report first and lead with the drift: `Fixed: N · New: N · Remaining: N · Score: 62 → 84`.

## Examples

### Example 1: SPA landing page (no backend)
```
Profile:   Vite SPA · no db · no auth · no payments · Netlify
Readiness: 96/100 (Solid) · 0×P1 · 0×P2 · 1×Verify · 1×Light · 10×N/A
| secrets-management | 🔎 Verify | SEC-02 | Confirm bundle ships no secrets | P2 | dist/ not scanned |
| frontend-mobile-quality | 🟡 Light | FE-02 | a11y pass | P3 | no aria labels found |
| auth/data/scaling/ai/api/… | ⚪ N/A | — | — | — | no backend |
Bottom line: grep the built bundle for keys; then ship.
```

### Example 2: Mature commerce app (Next.js + Postgres + LLM workers + payments)
```
Profile:   Next.js 15 · Postgres/Drizzle · OTP auth · AI workers · gateway payments · PaaS
Readiness: 74/100 (Risky) · 1×P1 · 1×P2 · 3×Verify · 1×Light · 3×N/A
| monetization-pricing | 🔴 Gap | PAY-04 | Callback returns 200 on failed charge | P1 | api/v1/payments/callback.ts:88 |
| deployment-cicd | 🟠 Gap | DEPLOY-04 | `build` not run in CI | P2 | .github/workflows/ci.yml |
| observability | 🟢 Solid | — | structured+correlated logs | — | platform/logger.ts:46 |
Bottom line: fix the webhook failure path before anything else — it silently eats revenue.
```

## Do / Don't

- **Do** run the scanner first, then verify its hits in source before carding them.
- **Do** cite a rule ID + `file:line` on every non-green row; mark N/A loudly.
- **Do** end with the score header, gap table, and finding cards — every run, same shape.
- **Don't** present unverified suspicions as gaps — downgrade to 🔎 Verify.
- **Don't** nitpick a mature app to look thorough; green is a valid audit result.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
