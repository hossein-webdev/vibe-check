# Changelog

## 4.5.0

**Inspection before occupancy.** Every industry where people can be harmed puts a check between
*we built it* and *people use it* — a kitchen isn't served from until it's inspected, a building
isn't occupied without sign-off. Software is the exception: the foundation gets poured over a
weekend and the first paying customer moves in on Monday, with nobody having looked at the schema,
the auth flow, or the API boundary. A failed foundation in construction is torn out before anyone
steps inside; in software it fails silently while customers live on top of it.

- `production-readiness` (2.2.0): **PROD-08** — no customer reaches a build that hasn't passed a
  structured pre-release audit, with the pass/fail result recorded. The point isn't the score, it's
  that passing *and* failing are written down, so "we didn't know" stops being available: P1s block,
  P2s ship only as a written accepted risk with an owner and a date, and the record lives with the
  release. It doubles as most of what a buyer's security review asks for (LEGAL-09), and as
  disclosure obligations tighten (LEGAL-13/14/15) the builders already inspecting absorb each new
  requirement as a checklist line instead of a retrofit. Distinct from PROD-06, which orders work
  *after* you know what's broken — this is the gate that stops an uninspected build reaching anyone.
- `growth-activation` (1.1.0): GROW-01 gains the rehearsal phase. Starting the content track late
  isn't the only failure — the other is discovering on launch day that you don't know *how*, so the
  first attempt gets deleted and nothing ships. Practise somewhere with no stakes (throwaway
  account, unrelated topic, nobody you know watching); bad output and zero views are the point,
  because you're building the muscle, not an audience. Added the calendar the corpus keeps
  implying: ~200 days out learn the skill, ~100 days out build in public until launch day carries
  proof, ~100 days after revise against real behavior (GROW-09). The numbers aren't the claim — the
  granularity is. The app can be built in a weekend; the business moves in hundred-day blocks.

## 4.4.0

**New sub-skill: `agent-operations`**, split out of `ai-engineering` — agents crossed the threshold
where they're their own discipline. A model that *answers* and a model that *acts* fail differently:
the second accumulates state, chooses tools, runs unattended, and can reach things that matter.
Pack: 22 → 23 skills.

**No rule IDs changed.** `agent-operations` owns AI-05, AI-06, and AI-08..11 exactly as they were
published; `ai-engineering` keeps AI-02..04 and AI-07 and carries a delegation row — the same
pattern as SEC-01..03 in `secrets-management`. Existing citations stay valid.

Three new rules land with the split:
- **AI-09 — budget the tool surface.** Every connected tool is evaluated on *every* request, so ten
  permanently-loaded connectors are ten things competing for a finite context window before the
  agent starts on the actual task, plus a failure mode where it picks a plausible wrong tool. Load
  per task, not per project; when a model can read the API docs and make the call itself, a
  permanent wrapper often costs more than it saves. Keep wrappers that earn it — fiddly auth,
  stateful protocols, a boundary you want enforced in one reviewed place. Quality degrading as a
  project accumulates integrations is usually clutter, not a worse model.
- **AI-10 — configuration is perishable.** Instruction files, skill definitions, prompt scaffolding,
  and connectors are all still being consulted months later. Stale instructions compete with current
  ones and the conflict reads as the model getting worse; workarounds for limitations that no longer
  exist are brakes. Review the stack on a cadence (a quarter is a reasonable default) and date your
  config so the next review is a decision, not an excavation.
- **AI-11 — boundaries belong in the tooling, not the reviewer.** The expensive agent failures share
  a shape: the agent did something destructive and a human approved it. Nobody catches every
  dangerous action by reading hundreds a day — that's a bottleneck without teeth. Scoped short-lived
  credentials, an egress allowlist, deny-by-default gates on destructive operations, and an
  append-only tool-call log. Then the approvals a human *does* see are the few that need judgment.

- `app-security`: SEC-10 gains the corollary — a successful prompt injection is only as dangerous as
  what the agent can reach, so the AI-11 boundaries turn one into a rejected tool call.
- `audit`: new matrix row routing to `agent-operations`; namespace table notes the AI- split.

## 4.3.0

**New skill: `growth-activation`** (GROW-01..09) — the half of shipping that isn't engineering the
product. The pack could take an app through all thirteen production layers and still leave it
launching to silence; this closes that gap. Pack: 21 → 22 skills.

It covers the arc end to end:
- **Before launch** — build the audience on the same clock as the product (GROW-01), because every
  week spent building without publishing is a week your future customers don't know you exist; and
  scope from what target customers **already use and pay for** (GROW-02) rather than from what's
  easy to generate. Sit with a real operator, count the features they actually touch across the ten
  platforms they pay for, and build that subset.
- **At the point of sale** — instrument every step from discovery to purchase with entries,
  drop-offs, and conversions (GROW-03), and version and A/B test the funnel the way you test
  features, treating checkout abandonment as seriously as API latency (GROW-04). You'd never run the
  app without error tracking.
- **After signup** — the activation window: one named core action completed in the first session,
  with a nudge when it isn't (GROW-05); the week-three habit gate, alerting on a drop below *that
  user's* own baseline rather than a global threshold (GROW-06).
- **Reading the truth** — cohort retention instead of total-user counts, which only ever go up
  (GROW-07), and feature adoption diagnosed as a discovery problem before anything is rebuilt
  (GROW-08).
- **At ~100 days** — the launch build was a hypothesis; schedule the review and pivot on behavior
  data (GROW-09).

- `audit`: new matrix row routing to `growth-activation`; `GROW-` added to the rule-ID namespace
  table and the router's description.

## 4.2.0

**Fourteen lessons folded in — eight new rules.** The theme of this batch is the layers nobody
audits: what sits *in front of* the database, what sits *in front of* the app, what the law now
requires of generated content, and what a build actually costs to run.

- `compliance-legal` (2.2.0): **LEGAL-14** — AI transparency. Products shipping model-generated
  content owe users a visible, non-removable disclosure (watermark / disclaimer / metadata tag), an
  affirmative opt-in before their input reaches a model, and an immutable generation log recording
  every output with its timestamp, model, and triggering input. The EU AI Act's transparency duties
  are the furthest along and are live now; the generator has never read a statute.
  **LEGAL-15** — your obligations are scoped by where your *users* are, not where you are: one
  subscriber in a covered market pulls you in, geo-fencing and ToS exclusions don't hold, and the
  real map comes from payment country and billing address.
- `app-security` (2.1.0): **SEC-13** — edge protection. A WAF in front of the whole stack (not
  per-endpoint limits), rate limiting that adapts to attack *behavior* rather than just volume, and
  a DDoS runbook written before the outage. **SEC-11** expanded: split error handling into a public
  layer and a private one, catch at every boundary (API routes, background jobs, webhook receivers,
  payment callbacks — not just the login form), and give the private half a searchable pipeline.
- `secrets-management` (2.1.0): **SEC-12** — block secrets at commit time with a pre-commit hook
  plus platform push protection. Roughly seven in ten audited projects have a live credential in
  their repository; rotating without adding the hook just schedules the next cleanup.
- `auth-access` (2.2.0): **AUTH-11** — row-level security is bypassed by everything that answers
  before the database does. Scope every cache key to the tenant, then sweep the layers people
  forget — search indexes, job queues, file paths, logs, rate-limit stores — and pin it with a
  cross-tenant test in CI.
- `data-architecture` (2.1.0): **DATA-09** — changing a live schema. Expand then contract (add,
  backfill, dual-write, cut over, drop in a later release), write the rollback before the migration,
  and rehearse on a staging mirror with current data shapes.
- `ai-engineering` (2.1.0): **AI-08** — agents that contradict themselves at step 15 ran out of
  context, not competence. A state document that travels with the task, decomposition into
  five-to-seven step chunks each in a fresh session, and a human checkpoint between chunks.
- `cost-infrastructure` (2.1.0): **COST-06** — unit economics. Cost attributed per *feature*, not
  per month; revenue per user against cost per user (a heavy user who costs more than they pay is a
  liability that grows as you succeed); and a monthly P&L reconciled automatically from the payment
  processor and hosting dashboards.
- `monetization-pricing` (2.2.0): **PAY-13** — when the buyer is an agent. Machine-readable product
  data, packaging that installs without a human, and metered pricing an agent can actually
  transact — a per-seat monthly plan is unbuyable by a consumer that shows up for one call.
- `scaling-performance` (2.1.0): SCALE-04 gains the ownership question — a cache stores the result
  *after* security ran for the first requester.
- `api-design` (2.10.0): APID-10 extended for the install-not-browse path — docs as the sales
  surface, self-serve credentials, metered pricing. (Global mirror synced.)

## 4.1.0

**Accessibility gets teeth.** `frontend-mobile-quality` had one generic a11y line; it now carries
three checkable rules and an hour-long audit procedure, and the legal side is named for what it is.

- `frontend-mobile-quality` (2.1.0): **FE-07** (every core flow completable by keyboard alone —
  reachable controls, visible focus, modals that trap and restore focus) and **FE-08** (text contrast
  meets WCAG AA: 4.5:1 body, 3:1 large text and UI boundaries) added. **FE-02** sharpened from
  "accessible" to the concrete screen-reader contract: alt text on every image, an accessible name on
  every icon-only control, ARIA on inputs and landmarks, sane focus order. New How-It-Works step with
  the three-audit procedure, a fix playbook block (including pinning the floor with axe-core in CI),
  and a worked example.
- `compliance-legal` (2.1.0): **LEGAL-13** — accessibility conformance documented: WCAG 2.1 AA named
  as the target, a dated audit kept, an accessibility statement published (target, known gaps,
  timeline, contact route), remediation logged. P1 for government, education, healthcare, and
  public-accommodation sectors. Digital products are treated as places of public accommodation in
  most jurisdictions, and a documented plan with open items is a far better posture than silence.
- `production-readiness` (2.1.0): **PROD-07** — feature health audit before the next feature. Every
  shipped feature scored *works / broken / adopted*: broken-and-used gets fixed first,
  broken-and-unused gets deleted, works-and-unused gets investigated. Building on a broken layer
  multiplies fragility, and the support inbox asks for the existing features to work — not for more.
- `monetization-pricing` (2.1.0): **PAY-12** — ICP and positioning written down from real research
  before building: the ICP derived from your actual background rather than a market that merely
  sounds profitable, community research done from the inside, and a positioning document (who you
  serve, what you deliver, how you differ, where you compete) that feeds the landing page, the
  one-sentence sale, and the pricing tiers.

## 4.0.0

**Back to MIT.** The project is MIT licensed again (v3.0.0–v3.5.0 were CC BY-NC-SA 4.0), and the
v3.x content is re-released under MIT too, so the whole history is usable under one permissive
license. Per-skill footers updated; `plugin.json` license set to `MIT`.

**New skill: `test-quality`** (TEST-01..09) — judges a suite on whether it would *catch* a bug, not
on coverage percentage: anti-fragility (no error-substring assertions, no private-symbol access, no
tautological readbacks, no expectations recomputed with the logic under test), rigor (fixed vectors,
boundaries, error paths), mocking discipline (never mock the unit under test), reuse
(parametrization), correctness (verify real library behavior), and coverage as a floor rather than a
target — with mutation survival as the real measure. Pack: 20 → 21 skills.

Rubric adapted with credit from [beyond-test-coverage](https://github.com/rollinsio/beyond-test-coverage)
by Michael Rollins (MIT). Added a Credits section to the README.

- `audit`: new matrix row routing suites to `test-quality`; `TEST-` added to the rule-ID namespace.

## 3.5.0

Nine lessons folded in (a backlog batch):
- `production-readiness`: new **PROD-06** — break the endless-debugging loop by auditing the whole
  stack first, then queueing work by **business risk** (money / data / legal), not by whatever broke
  most recently.
- `app-security`: new **SEC-11** — production errors return generic messages; stack traces and
  internals stay in server-side logs. Input validation extended to *every* endpoint, not just forms.
- `observability`: new **OBS-14** — audit trail on sensitive actions (plan changes, email changes,
  deletions, permission edits): the generator built the actions but never the receipts.
- `frontend-mobile-quality`: new **FE-06** — build for where customers actually are: locale-aware
  formatting and per-user timezone for scheduled messages.
- `monetization-pricing`: new **PAY-11** — multi-currency checkout (processors support scores of
  currencies; the default is one).
- `cost-infrastructure`: new **COST-05** — document your **customer ceiling**: the bundled stack is
  right for the first ~10 customers, enterprise procurement is several evolutions away, and knowing
  the line closes deals.
- `api-design`: APID-10 extended — agents as customers: publish machine-readable product data,
  expose the criteria agents filter on, and check how assistants actually describe you.
  (Global mirror synced.)
- `deployment-cicd`: DEPLOY-01 — the shared dev/prod failure mode spelled out (one database, one
  key set, test accounts beside paying customers).

## 3.4.0

Three new lessons folded in:
- `reliability-recovery`: new **REL-07** — incident communication: a status page on *separate*
  infrastructure (hosted on your own stack it goes down with you), maintenance announced in advance,
  and an incident-comms workflow prepared before the outage. Silence turns a technical problem into
  a trust problem.
- `auth-access`: AUTH-10 expanded to audit the **provider**, not just the integration — can it do
  SAML/SSO at all, can it produce its own compliance documentation for the buyer's vendor audit, and
  what does migrating off it cost before you're locked in.
- `compliance-legal`: new **LEGAL-12** — health data (HIPAA/PHI): encryption everywhere it lands
  including **logs, backups, and exports**, per-record access audit trails (role-based access alone
  isn't enough), and a BAA with every third party that can see it.

## 3.3.0

Three new lessons folded in:
- `auth-access`: AUTH-04 expanded into full **session management** — pick a session lifetime from
  data sensitivity (hours for financial data, days for low-risk content) instead of the framework's
  forever-default, cap concurrent sessions per user, and revoke every session instantly on a
  credential change (otherwise a password reset is a false sense of security).
- `monetization-pricing`: new **PAY-10** — transactional email deliverability: SPF/DKIM on the
  sending domain, transactional sending split from marketing, and inbox-placement monitoring
  (a "delivered" log line only means a mail server accepted it). A missing receipt reads as fraud
  and returns as a chargeback.
- `compliance-legal`: new **LEGAL-11** — sales tax / VAT: map economic-nexus exposure by
  jurisdiction, enable tax collection at checkout (built into the processor but off by default),
  and keep a remittance calendar — collecting without remitting is a liability.

## 3.2.0

Three new lessons folded in:
- `monetization-pricing`: new **PAY-08** — dispute defense before the first chargeback (published
  refund policy, chargeback-rate alerts, a prepared response workflow; a dispute can freeze the whole
  processor balance); new **PAY-09** — dunning (staggered retries, failed-payment email sequence,
  grace period before cancel; recovers 30–40% of failed charges).
- `compliance-legal`: new **LEGAL-10** — retention obligations, the flip side of deletion: some
  records are legally required to be kept (regulated sectors, up to ~7 years), so separate
  user-controlled data from law-required records, map a schedule to your obligations, and keep an
  audit trail.

## 3.1.0

- New skill: **`solidity-security`** (SOL-01..10) — a smart-contract / EVM audit covering the
  vulnerability classes that recur in competitive audit findings: reentrancy (incl. cross-function),
  access control (tx.origin trap), oracle manipulation (spot vs TWAP, Chainlink staleness),
  arithmetic precision, unchecked return values (SafeERC20), flash-loan surface, MEV/front-running,
  signature replay (EIP-712), proxy safety (EIP-1967), and dangerous token integrations
  (fee-on-transfer, rebase, pausable, ERC-777). Self-contained, no external calls; fix playbook with
  paste-able Solidity. Community contribution via PR #2. Pack: 19 → 20 skills.
- `audit`: new matrix row routing smart-contract concerns to `solidity-security`; `SOL-` added to
  the rule-ID namespace table.

## 3.0.0

**License change (the reason for the major bump):**
- Relicensed from MIT to **CC BY-NC-SA 4.0**: visible attribution to hossein-webdev required,
  no commercial use, derivatives must carry the same license. Versions prior to v3.0.0 remain
  available under MIT for those versions only.
- Every SKILL.md now carries an attribution/license footer (skills travel as single files; the
  notice travels with them).
- `plugin.json` license updated to `CC-BY-NC-SA-4.0`; README badge + license section updated.

No content/rule changes in this release.

## 2.9.0

Three new lessons folded in:
- `api-design`: new **APID-11** — return only what the client needs: opaque identifiers instead of
  sequential/internal IDs (enumeration via incrementing is one API call away), explicit response
  shapes instead of `SELECT *`-to-JSON, and the API as the first impression technical buyers judge.
  (Global mirror synced.)
- `deployment-cicd`: DEPLOY-01 tightened — staging only counts if it mirrors production (schema,
  services, env vars), with tests gating automatic promotion.
- `cost-infrastructure`: serverless vs containers as a maturity decision — the convenience-premium
  vs ops-burden gap analysis, and the hybrid answer (serverless request/response, containers for
  background work, dedicated for scheduled jobs).

## 2.8.0

Three new lessons folded in:
- `compliance-legal`: new **LEGAL-09** — security-questionnaire readiness: answers prepared before
  the questionnaire arrives (encryption, scan cadence, pen-test date, IR plan, data residency), the
  audit → fix → pen test → re-audit pipeline, and a public security page that answers half the
  questionnaire for free.
- `app-security`: SEC-09 ordering — audit first, pen test second (attacking known-broken
  infrastructure wastes the engagement); the two artifacts double as procurement evidence.
- `reliability-recovery`: new **REL-06** — post-mortem discipline: five-field template before the
  first incident, the blameless 48-hour rule, and an incident library so the same root cause never
  causes the same outage twice.
- `production-readiness`: PROD-05 extended with the **70/30 split** — playbooks auto-resolve ~70%;
  the human 30% (customer-is-right disputes, feature-requests-as-bugs, the email that isn't about
  the stated issue) is where trust is earned.

## 2.7.0

Five new lessons folded in:
- `api-design`: new **APID-10** — design for machine consumers: structured, self-describing
  responses and MCP exposure; AI assistants integrate MCP-speaking services in minutes and route
  around the rest. Discoverability is now a distribution channel. (Global mirror synced.)
- `compliance-legal`: new **LEGAL-08** — the pre-revenue document set (ToS, privacy policy, DPA,
  refund policy, MSA + insurance backstop); LEGAL-03 rebuilt as a process — cascade map first,
  soft-delete with a ~30-day retention window then automatic hard delete, and a
  full data report producible on demand within the regulatory window.
- `data-architecture`: new **DATA-08** — keep downstream systems in agreement via change data
  capture: real-time events instead of polling, routed by type, with dead-letter handling.
- `observability`: new **OBS-13** — the support inbox as a monitoring tool: root-cause triage
  (3× same cause = engineering bug), the three buckets (UX / observability gap / wrong design),
  and the weekly 30-minute review.

## 2.6.0

Five new lessons folded in:
- `auth-access`: new AUTH-10 — enterprise SSO as a procurement gate: SAML 2.0/OIDC done properly
  (handshake, assertions, attribute mapping, sessions) and multi-tenant SSO with per-tenant IdP
  configuration, built before the IT checklist arrives.
- `app-security`: SEC-07 expanded — CSP script-source lockdown: audit every external resource,
  run report-only for a week, then enforce a whitelist (a dozen unapproved script domains is an
  attack surface, not a feature).
- `deployment-cicd`: new DEPLOY-11 — runbooks per failure scenario + automated metric-driven
  rollback; release section reframed around decoupling deploy (technical) from release (business)
  — the "any day is deploy day" architecture.
- `monetization-pricing`: PAY-06 expanded — price against the quantified pain (not what feels
  fair), the one-sentence sale (pain → resolution), and finding first customers where the
  complaints live.
- `database-selection`: new DBS-05 — migration timing by math: the 10×-with-optimization test, the
  architecturally-impossible test, and workaround-cost vs migration-cost.

## 2.5.0

Four new lessons folded in:
- `auth-access`: full **token lifecycle** added to AUTH-04 — silent background refresh before the
  ~60-min expiry, state-preserving reauth on refresh failure, refresh-token rotation on every use;
  AUTH-08 extended with **tenant-breach anatomy** — cache keys must include tenant context, and
  cross-tenant reads must alert the moment they happen (you must answer "how long / who else"
  immediately).
- `production-readiness`: new **PROD-05** — the support system ships with the product: per-feature
  support playbooks (same sprint), real-time production signals, and T1/T2/T3 tiers defined before
  the first customer. The support gap kills more launches than bad code.
- `api-architecture`: API-02 expanded — trust nothing at the boundary: schema-validate every route
  (reject/strip), sanitize every string, middleware rate-pattern awareness (50 req/s = probing).

## 2.4.0

Four new lessons folded in:
- `compliance-legal`: new LEGAL-06 — cyber liability insurance once you hold others' data
  (~$200–600/yr vs a five-figure breach; underwriters require security basics, making the security
  audit an insurance prerequisite); new LEGAL-07 — platform ToS liability caps (provider exposure =
  your last invoice); LEGAL-01 extended — the privacy policy must match what the app actually does.
- `observability`: new OBS-12 — session replays wired to error events + rage-click detection
  ("watch what happened instead of asking"); intro reframed around the **discovery gap** (60s vs 6h
  = the day's revenue + trust cost).
- `scaling-performance`: SCALE-05 extended with the respond-then-queue pattern — confirm the moment
  the core action succeeds, queue the rest with independent retries, and monitor the queue (silent
  queue failures are worse than request failures).

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
