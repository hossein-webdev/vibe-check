---
name: audit
description: >
  Runs an adaptive, evidence-based production-readiness audit on a vibe-coded (AI-generated) app. It
  profiles what the app actually is from its code, checks only the areas that apply, grades each with
  cited evidence, and always ends with a prioritized gap table ("in this section you're missing X").
  Use this first when the user wants to ship/launch, asks "is my app production-ready / what am I
  missing", has a demo that breaks with real users, or is hardening something built with Lovable,
  Cursor, Bolt, v0, Replit, or similar. Routes gaps to app-security, auth-access, scaling-performance,
  data-architecture, ai-engineering, observability, deployment-cicd, reliability-recovery,
  compliance-legal, api-architecture, frontend-mobile-quality, cost-infrastructure, and
  monetization-pricing.
user-invokable: true
metadata:
  category: production-readiness
  role: router
  version: "1.1.0"
---

# Vibe Check — Production Readiness Audit

The entry point. AI tools get you to something that *runs* fast, but "runs on my screen" and "survives
real users" are different bars. This audit finds the gap — **adaptively** (only what applies),
**accurately** (claims backed by evidence), and ends with a **prioritized gap table** you can act on.

It does not assume every app is the same. A static landing page and a multi-tenant SaaS get different
audits. It also doesn't cry wolf: a mature app is graded mostly green, with only the real gaps flagged.

## When to Use This Skill

- User wants to "ship", "launch", "go live", or asks "is this production-ready?".
- User asks "what am I missing before launch?".
- A working demo "falls apart when real people use it".
- User is hardening an app from Lovable, Cursor, Bolt, v0, Replit, etc.
- User says "it works, but…" (slow, insecure, crashes, no logs, scary bill).

## How It Works

### Step 1 — Profile the app from its code (don't assume, don't just ask)

Read the repo first; only ask the user what the code can't tell you. Concrete signals:

- **Stack / backend:** `package.json`, framework configs (`next.config`, `vite`, etc.). Static client-only, or is there a server / API routes (`app/api`, `pages/api`, express, serverless)?
- **Database:** ORM/driver/config (Drizzle, Prisma, `pg`, Supabase, Firebase, Mongo), `migrations/`, schema files.
- **Auth:** login flows, sessions/JWT, providers (Clerk/Auth0/Supabase/NextAuth), single-user vs multi-tenant (tenant_id, org).
- **LLM / AI:** deps (`openai`, `@ai-sdk/*`, `anthropic`, `gemini`), where models are called.
- **Payments:** Stripe / local gateways / checkout / webhooks.
- **Mobile:** web only vs React Native / Capacitor / universal links.
- **Risk signals to grep:** committed `.env*`, `sk-`/`sk_live`/`API_KEY`/`SECRET` in source, `NEXT_PUBLIC_*` holding secrets, RLS/policies, Sentry/logging, CI config, tests.
- **Scale intent:** ask only if not inferable — expected users at launch and in 6 months.

### Step 2 — Select the areas that apply

Include or skip each area with the matrix. **Skipping is a real result** — mark it `N/A`, don't invent work.

| Area | Applies when… | Route to |
|---|---|---|
| Code ownership & launch gaps | Always (any AI-built app) | `production-readiness` |
| Security & secrets | Always | `app-security` |
| Auth & access control | There are accounts / protected data | `auth-access` |
| Data & schema | There's a database | `data-architecture` |
| Scaling & performance | Backend/DB **and** real traffic expected | `scaling-performance` |
| AI / LLM engineering | The app calls an LLM / paid AI API | `ai-engineering` |
| Observability | There's a backend that can fail | `observability` |
| Deployment & CI/CD | Anything you redeploy | `deployment-cicd` |
| Reliability & recovery | You hold user data or promise uptime | `reliability-recovery` |
| Compliance & legal | Collects personal data / sells B2B / app store | `compliance-legal` |
| API & backend boundary | There's a backend/API the client calls | `api-architecture` |
| Frontend & mobile quality | There's a UI (deep links only if mobile) | `frontend-mobile-quality` |
| Cost & infrastructure | Infra/usage is non-trivial | `cost-infrastructure` |
| Monetization & billing | The app charges money | `monetization-pricing` |

### Step 3 — Grade each applicable area (with the rubric below)

For every applicable area assign a **status** and, for anything not green, a **priority** — and **cite
evidence** (`path:line`, or "not found — searched X"). No claim without a reason.

**Status legend**
- 🟢 **Solid** — implemented well; nothing to do.
- 🔴 **Gap (P1)** — ship-blocker: data exposure, money loss, auth bypass, data loss.
- 🟠 **Gap (P2)** — fix before scale / enterprise / heavier traffic.
- 🔎 **Verify** — likely fine but can't be confirmed statically; the user must check one specific thing.
- 🟡 **Light (P3)** — polish / nice-to-have.
- ⚪ **N/A** — doesn't apply to this app.

**Priority = blast radius, not list order**
- **P1:** leaks data, loses money, bypasses auth, loses data, or exposes a secret. Fix before launch.
- **P2:** breaks under scale, blocks an enterprise/app-store deal, or is a known CVE. Fix soon.
- **P3:** cosmetic, perf polish, or future-proofing.

**Accuracy guards (this is what makes it trustworthy)**
- Prefer evidence over intuition; if you didn't see it in the code, mark it 🔎 Verify, not 🔴 Gap.
- Mark `N/A` loudly — never pad the report with irrelevant areas.
- Don't treat a mature app like a demo: green is a valid (and common) result.
- Note false-alarm avoidance: e.g. "no RLS" is **not** a gap if the client never touches the DB and
  the API gates every query — downgrade it to a defense-in-depth 🔎 Verify.

### Step 4 — Route, then print the table (required output)

Hand each 🔴/🟠/🔎 to its domain skill for the fix detail, then **always finish with the gap table**.

## Required output format

Produce a short scorecard, then the table, then a one-line bottom line. Use this shape:

```
# Vibe Check — <app name>
Profile: <one line: stack · db · auth · ai · payments · platform · scale>

## Gap table
| Section (skill)        | Status      | What you're missing / must do            | Priority | Evidence            |
|------------------------|-------------|------------------------------------------|----------|---------------------|
| app-security           | 🔴 Gap      | Remove committed .env; rotate key         | P1       | .env.local:1        |
| monetization-pricing   | 🔎 Verify   | Confirm webhook verified + idempotent     | P1       | api/pay/callback.ts |
| deployment-cicd        | 🟠 Gap      | Add `build` step to CI                    | P2       | .github/ci.yml      |
| observability          | 🟢 Solid    | —                                         | —        | logger.ts:46        |
| auth-access            | ⚪ N/A      | (no accounts)                             | —        | —                   |
...one row per AREA (applicable or N/A)...

Bottom line: <N areas → X P1, Y P2, rest green/NA>. Fix first: <the single most important thing>.
```

Rules for the table: **one row per area** (include N/A rows so the user sees what was considered);
sort by priority (P1 → P2 → P3 → green → N/A); every non-green row needs an Evidence cell; keep
"What you're missing" to one actionable phrase.

### Step 5 — Re-audit before launch

Re-run as a go/no-go once the P1/P2 rows are cleared.

## Examples

### Example 1: Static marketing site (v0, no backend/db/auth)
**Action**: Profile → static. Most areas N/A.
**Output** (abridged table):
```
| app-security            | 🔎 Verify | Confirm no secrets in the client bundle | P2 | —              |
| frontend-mobile-quality | 🟡 Light  | Responsive + a11y + Lighthouse pass     | P3 | —              |
| deployment-cicd         | 🟢 Solid  | —                                       | —  | vercel.json    |
| auth / data / scaling / ai / api / reliability / compliance / cost / monetization | ⚪ N/A | — | — | — |
Bottom line: 3 areas apply, 0 P1. Fix first: confirm the bundle ships no secrets.
```

### Example 2: Mature B2C app (Next.js, Postgres, OTP auth, LLM workers, payments)
**Action**: Profile → most areas apply; app is well-built, so grade mostly green and flag only real gaps.
**Output** (abridged table):
```
| app-security          | 🔴 Gap    | Committed .env.local (+ rotate)         | P1 | .env.local:1          |
| monetization-pricing  | 🔎 Verify | Payment callback verified + idempotent  | P1 | api/v1/pay/callback   |
| deployment-cicd       | 🟠 Gap    | `build` not run in CI                    | P2 | .github/workflows/ci  |
| observability         | 🟢 Solid  | Structured + leveled + correlated logs   | —  | platform/logger.ts:46 |
| auth-access           | 🟢 Solid  | Opaque tokens, revocation, 2FA           | —  | platform/auth.ts      |
| multi-tenant/Stripe/deeplinks | ⚪ N/A | —                               | —  | —                     |
Bottom line: 14 areas → 1 P1, 1 P2, 2 verify, rest green/NA. Fix first: remove the committed .env.
```

## Do / Don't

- **Do** profile from the code first; cite `file:line` for every non-green row.
- **Do** mark N/A loudly and grade a mature app green — accuracy beats noise.
- **Do** always end with the gap table sorted by priority, one row per area.
- **Don't** flag what you didn't verify as a hard Gap — use 🔎 Verify instead.
- **Don't** treat "no RLS / no X" as a gap when the architecture makes it irrelevant.
