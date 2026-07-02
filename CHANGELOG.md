# Changelog

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
