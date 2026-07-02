# Changelog

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
