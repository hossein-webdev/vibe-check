# Audit reference — finding cards, aspect detection, scoring

Companion to `SKILL.md`. This file holds the detailed specs the audit follows.

## Contents
1. [Finding-card spec](#1-finding-card-spec)
2. [Aspect-detection matrix](#2-aspect-detection-matrix)
3. [Adaptive rules](#3-adaptive-rules)
4. [Scoring](#4-scoring)
5. [Scanner usage & interpretation](#5-scanner-usage--interpretation)
6. [Rule-ID namespaces](#6-rule-id-namespaces)

---

## 1. Finding-card spec

Every non-green row in the gap table expands into a card. Format (exact shape):

```
### [RULE-ID] <one-line defect title>            Severity: P1|P2|P3 · Confidence: Confirmed|Likely|Verify
Where:    <file:line — or "not found; searched <where>">
What:     <one or two sentences: the factual state of the code>
Why it matters: <the concrete consequence if shipped as-is — money, data, users, downtime>
Fix (<time estimate>):
  1. <real command or concrete edit>
  2. <next step>
Verify:   <a check that proves the fix landed — command output, test, or observable behavior>
Routes to: <the domain skill that owns this rule>
```

Card rules:
- **Confidence levels**: `Confirmed` = seen directly in code/config; `Likely` = strong indirect signal
  (name-dropped dep, partial config); `Verify` = needs a runtime/dashboard check the auditor can't do
  statically. Never present a Verify item as a Confirmed gap.
- **Fix is time-boxed and literal** — commands the user can paste, not "improve your security".
- **Verify line is mandatory** — a fix without a proof-of-fix is a guess.
- Sort cards P1 → P2 → P3; within a band, by blast radius.
- Cite the rule ID from the owning skill (see §6). One card per rule violation; if the same rule fails
  in many places, one card with a `Where:` list.
- Evidence honesty: quote real paths/lines from *this* project. If the evidence came from the scanner,
  spot-check it in the source before writing the card (scanner output contains false positives — §5).

## 2. Aspect-detection matrix

Profile the project by evidence, not assumption. The scanner automates most of this; verify the rest.

| Aspect | Signals | Effect on audit |
|---|---|---|
| Framework / runtime | `next.config.*`, `vite.config.*`, `nuxt.config.*`, `svelte.config.*`, `astro.config.*`; deps: express/fastify/hono/nest; `main.py` + fastapi/flask; `go.mod` | Selects which checks make sense; framework-specific traps |
| Rendering model | `app/` or `pages/` dir (SSR/RSC); pure `dist/` SPA; `middleware.*` | SPA → everything in the bundle is public; SSR → server/client boundary checks |
| Serverless | `vercel.json`, `netlify.toml`, `wrangler.toml`; platform limits | Function-timeout traps; connection pooling emphasis (SCALE-01 weight up) |
| Monorepo | `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json` | Audit **per app**, one gap table each; shared-package risks noted once |
| Package manager | lockfile present? which? | Missing lockfile = SEC-06 finding (unpinned supply chain) |
| Database | drizzle/prisma/typeorm/mongoose configs; `@supabase/supabase-js`; `firebase.*`; migrations dir | Enables DATA-* checks; no migrations dir = DATA-04 |
| Auth style | provider deps (clerk/auth0/next-auth/better-auth/lucia) vs raw `jsonwebtoken`/`bcrypt` usage | Custom auth → run auth-access at maximum strictness (AUTH-01 flag) |
| AI usage | openai/@ai-sdk/anthropic/gemini/replicate/langchain deps; where called | Enables AI-*/LLM-* checks; **client-side model call = automatic P1 (LLM-06)** |
| Payments | stripe/paypal/gateway deps; `webhook`/`callback` route files | Enables PAY-* checks; webhook files get read line-by-line (PAY-02/03/04) |
| Background work | bullmq/inngest/trigger.dev/pg-boss deps; `workers/`/`jobs/` dirs; cron configs | Idempotency + retry checks (SCALE-05, REL-03) |
| Mobile / native | react-native/expo/capacitor; association files (`apple-app-site-association`, `assetlinks.json`) | Enables FE-05 deep links; else deep links = N/A |
| i18n / multi-region | i18n configs, `locales/` | Latency/regional notes in scaling; content notes in compliance |
| Tests + CI | test configs, `.github/workflows/*`, husky | No CI = DEPLOY-03; CI without build = DEPLOY-04 |
| Hosting | `vercel.json`/`liara.json`/`fly.toml`/`render.yaml`/Dockerfile/Procfile | Apply that platform's known limits and env-panel conventions |
| Maturity | migrations count, test lines, structured logging, docs | Calibrate tone: mature app → mostly green is the CORRECT output |

## 3. Adaptive rules

- **Serverless detected** → check function timeout fit for long work; weight connection pooling and
  background-jobs checks up; flag platform free-tier ceilings.
- **Monorepo detected** → run the audit per app; emit one gap table per app plus a shared-infra table.
- **Custom/hand-rolled auth detected** → auth-access strict mode: verify hashing, token expiry,
  `alg:none` rejection, server-side logout, cross-user test. Never assume a provider's defaults.
- **Client-side AI call detected** → automatic P1 (LLM-06 + SEC-02): the key and the bill are public.
- **SPA (no server) detected** → api/auth/data areas likely N/A, but *everything in the bundle is
  public*: secrets scan of the bundle is the headline check.
- **Payments detected** → read the webhook/callback handlers line-by-line; look specifically for
  catch-blocks that return 2xx on failure (PAY-04) and missing signature verification (PAY-02).
- **Mature app detected** → grade green generously where evidence supports it; concentrate the report
  on the few real gaps. A wall of nitpicks on a solid codebase is a failed audit.
- **Nothing detected for an area** → the row is ⚪ N/A with a one-word reason. Never pad.

## 4. Scoring

Start at 100. Deduct per finding: **P1 −25 · P2 −10 · Verify −3 · Light (P3) −1**. Floor at 0.
N/A areas affect nothing. Bands:

| Score | Band |
|---|---|
| 80–100 | 🟢 Solid — ship, keep the verify list |
| 50–79 | 🟠 Risky — fix P1/P2 before real users/money |
| 0–49 | 🔴 Ship-blocker — do not launch until P1s are closed |

Print in the report header: `Readiness: 62/100 (Risky) · 1×P1 · 2×P2 · 3×Verify · 2×Light · 4×N/A`.

## 5. Scanner usage & interpretation

```
node <plugin>/skills/audit/scripts/scan.mjs <project-dir> [--json out.json]
```
Zero deps, Node ≥18, read-only, ~seconds even on 3k+ files. If Node is unavailable, do the same checks
manually with Grep/Glob (the matrix above lists every signal).

Interpreting output — the scanner reports **facts, not findings**; you judge:
- `env.trackedEnvFiles` uses `git ls-files` — an `.env` on disk but untracked is a **P3 hygiene note**,
  not a P1 leak. Only tracked env files are P1 candidates.
- `secrets[]` includes false positives by design (docs examples, CI test-DB URLs, sample keys).
  **Open each hit** before carding it: is it a real credential, reachable, and live? A postgres URL in
  `ci.yml` pointing at `localhost` test DB is fine. A `sk_live_` in a component is P1.
- `secrets[].clientReachable=true` + real credential = P1 (SEC-02). Server-side real credential
  hard-coded = P1 (SEC-01, hard-coding). Doc/sample = ignore.
- `signals.customAuthFiles` = raw jwt/bcrypt usage sites → triggers auth strict mode, not a finding
  by itself.
- `signals.rlsMentions=0` with a client-side DB SDK (supabase-js in components) → SEC-04 candidate.
  With a server-only DB driver, RLS absence is a Verify (defense-in-depth), not a Gap.
- `stats.truncated=true` → say so in the report ("scanned first 4000 files") — no silent caps.

## 6. Rule-ID namespaces

| Prefix | Owning skill | | Prefix | Owning skill |
|---|---|---|---|---|
| PROD- | production-readiness | | OBS- | observability |
| SEC- | app-security (SEC-01..03 detailed in secrets-management) | | DEPLOY- | deployment-cicd |
| AUTH- | auth-access | | REL- | reliability-recovery |
| SCALE- | scaling-performance | | LEGAL- | compliance-legal |
| DATA- | data-architecture | | API- | api-architecture |
| DBS- | database-selection | | FE- | frontend-mobile-quality |
| AI- | ai-engineering | | COST- | cost-infrastructure |
| LLM- | llm-cost-control | | PAY- | monetization-pricing |

Every rule ID is defined exactly once, in a `## Rules` table inside its owning skill. The audit cites
IDs; the owning skill carries the full check + fix playbook.
