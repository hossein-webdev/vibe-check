# Changelog

## 2.3.0

Five new lessons folded in:
- `reliability-recovery`: REL-02 expanded into the three backup decisions — frequency
  (point-in-time recovery is a setting, turn it on; daily = accepting 24h of loss), location
  (same-server backup = the same risk twice; go cross-region/off-site), and monthly restore drills.
- `deployment-cicd`: new DEPLOY-10 — the CI free-tier quota trapdoor (minutes die mid-sprint,
  overage turns free into four figures): usage alert at ~75%, path-based conditional pipelines,
  self-hosted runners as the escape hatch.
- `app-security`: SEC-10 expanded — assistant-context prompt injection is proven (critical RCE via a
  poisoned PR description); everything an AI assistant reads (repo, comments, issues, PRs) is an
  injection surface.
- `scaling-performance`: SCALE-04 expanded — caching as a business decision: staleness budget per
  data class (pricing/permissions/inventory/account status: never stale), event-driven invalidation
  over TTL timers, expiry-stampede protection.
- `production-readiness`: vulnerability stat refreshed to 2–3× (latest measurement ~2.7×).

## 2.2.0

- New skill: **`api-design`** (APID-01..09) — the API surface itself: resource naming, semantic
  status codes (never 200 for failures — ties into PAY-04 for webhooks), one standard error shape,
  cursor/offset pagination, filtering/sorting conventions, rate-limit headers, versioning +
  deprecation policy (Sunset, max 2 live versions), idempotency keys, request-id echoing.
  Child of `api-architecture` (which keeps the boundary/architecture side). Pack: 18 → 19 skills.
- `audit`: new matrix row routing API-surface concerns to `api-design`.

## 2.1.0

Four new lessons folded in:
- `observability`: "monitoring that isn't theater" — outside-in health checks from multiple regions
  (OBS-09), logs+metrics+traces correlated via OpenTelemetry with a <60s trace target (OBS-10), and
  SLOs with error budgets that gate release pace (OBS-11), incl. the uptime math (99% = 3d15h/yr).
- `api-architecture`: 3-layer rate limiting as architecture (API-06) — hard limits (safety net),
  adaptive limits (token bucket/sliding window under load), tiered limits as the pricing model.
- `monetization-pricing`: tiered rate limits as pricing architecture (free tier proves value,
  restriction creates the upgrade).
- `reliability-recovery`: REL-05 — the generator never raises backup strategy on its own; the
  default AI-built app is one DB/one region/no schedule/no retention/no tested restore.
- `deployment-cicd`: DEPLOY-08 expanded with concrete platform ceilings — concurrency caps,
  execution-time limits, bandwidth caps, silent function-size deploy failures.

## 2.0.0

**Linter-grade audit.**
- Stable **rule IDs** across the pack (SEC-, AUTH-, SCALE-, DATA-, DBS-, AI-, LLM-, OBS-, DEPLOY-,
  REL-, LEGAL-, API-, FE-, COST-, PAY-, PROD-) — every rule defined once in its owning skill with a
  `## Rules` table and severity-if-failed.
- **Readiness score** (/100; P1 −25 · P2 −10 · Verify −3 · Light −1) with Solid/Risky/Ship-blocker bands.
- **Finding cards**: every gap now reports Where/What/Why-it-matters/time-boxed Fix commands/Verify
  step/Routes-to, with Confirmed/Likely/Verify confidence. Spec in `skills/audit/reference.md`.
- **Static pre-scanner** `skills/audit/scripts/scan.mjs` (Node ≥18, zero deps, read-only): env
  tracking, secret patterns, dependency classes (db/auth/ai/payments/queue/mobile/observability),
  routes/workers/CI/tests/migrations, RLS + header mentions. Scanner reports facts; the audit
  verifies before carding.
- **Deep aspect detection + adaptive rules** (reference.md): serverless, monorepo (per-app audits),
  hand-rolled auth strict mode, client-side AI call = auto-P1, SPA bundle rules, maturity calibration.
- **Re-audit drift**: reports saved as `vibe-check-report.md`; re-runs diff fixed/new/remaining + score delta.

**Three new sub-skills** (pack: 15 → 18): `secrets-management` (from app-security),
`database-selection` (from data-architecture), `llm-cost-control` (from ai-engineering) — parents
slimmed and route to them.

**Content + structure.**
- `production-readiness`: the 2-of-13-layers framing, the ~2× vulnerability stat, concrete scale
  tiers (1k/10k/100k users).
- `app-security`: monoculture risk (template-cloned apps share exploitable flaws) + a 30-minute
  3-check starter before the full list.
- Every domain skill: `## Rules` table + `## Fix playbook` with real commands + `metadata.version`.
- Checklist format for `compliance-legal` and the monetization webhook path; observability/scaling
  sections restructured into single flows.

## 1.2.0

- `scaling-performance`: added the ordered scaling decision tree — diagnose connections → queries →
  reads/writes before spending on bigger infra (a pooler beats a replica; the frequent query beats the
  slow one; replicas only help reads).
- `data-architecture`: DB choice is now workload-driven (read/write ratio, schema-change-under-traffic
  branching, lock-in vs portability) and includes edge/SQLite (Cloudflare D1) alongside Neon/PlanetScale.
- `observability`: new "catch the failures your code doesn't know about" section — business-metric
  alerting, synthetic transactions, and dead-letter queues for webhooks.
- `monetization-pricing`: added the silent-revenue-loss trap — never return `2xx` for a failed charge
  (the provider won't retry and error trackers can't see it).
- `app-security`: added AI/prompt supply-chain trust tiers (first-party / vetted / unvetted) and
  prompt-injection mitigations (isolation, review, rotation).

## 1.1.0

- `audit` is now evidence-based and ends with a **required prioritized gap table** (one row per area,
  "what you're missing", priority, and a cited `file:line` for every non-green row).
- Added a grading rubric: 🟢 Solid · 🔴 Gap (P1) · 🟠 Gap (P2) · 🔎 Verify · 🟡 Light (P3) · ⚪ N/A,
  with priority defined by blast radius (data/money/auth/data-loss = P1).
- Accuracy guards: profile from code first, mark N/A loudly, grade mature apps green, downgrade
  unverifiable claims to "Verify" instead of asserting a gap, and avoid architecture-irrelevant flags.

## 1.0.0

- Initial release: 15 skills.
- `audit` — adaptive production-readiness audit that profiles the app and routes to focused skills.
- Domain skills: `production-readiness`, `app-security`, `auth-access`, `scaling-performance`,
  `data-architecture`, `ai-engineering`, `observability`, `deployment-cicd`, `reliability-recovery`,
  `compliance-legal`, `api-architecture`, `frontend-mobile-quality`, `cost-infrastructure`,
  `monetization-pricing`.
- Packaged as a Claude Code plugin with a single-plugin marketplace.
