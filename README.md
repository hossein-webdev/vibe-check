# Vibe Check

**Your app runs. But does it survive real users?**

Vibe Check is a set of Claude Code skills that take a vibe-coded (AI-generated) app from "works on my
screen" to "holds up in production." It starts with one adaptive audit that figures out what your app
actually *is*, then runs only the checks that apply and routes each gap to a focused skill.

No lectures, no one-size-fits-all checklist. A static landing page and a multi-tenant SaaS get very
different advice.

## Install

```text
/plugin marketplace add hossein-webdev/vibe-check
/plugin install vibe-check@vibe-check-marketplace
```

Then restart Claude Code (or run `/plugin`) and you're set. Skills are namespaced under `vibe-check:`.

> Prefer to copy manually? Drop the folders in [`skills/`](skills/) into `~/.claude/skills/` (global)
> or your project's `.claude/skills/`. Each is a standalone `SKILL.md`.

## Use it

Start with the audit — it profiles your app and tells you what matters:

```text
/vibe-check:audit
```
> "Built this with Lovable, launching to ~500 users next week. What am I missing?"
> → profiles the app, marks what's N/A, and hands you a prioritized list routed to the right skills.

Or jump straight to a skill when you already know the symptom:

```text
/vibe-check:scaling-performance     # "it froze when a bunch of people signed up"
/vibe-check:app-security            # "could someone steal my API keys?"
/vibe-check:auth-access             # "can one user read another user's data?"
/vibe-check:ai-engineering          # "my GPT feature bill is scary"
```

You can also just describe your problem in plain language — the matching skill activates on its own.

## The skills

| Skill | What it covers |
|---|---|
| **`audit`** | Adaptive production-readiness audit — profiles your app and routes to everything below |
| `production-readiness` | The last-mile mindset: owning the generated code, the unglamorous remainder |
| `app-security` | Exposed keys, secrets & rotation, row-level security, dependencies, headers, XSS |
| `auth-access` | Authentication vs authorization, JWT/sessions, roles, multi-tenant isolation |
| `scaling-performance` | Connection pooling, caching layers, background jobs, query tuning |
| `data-architecture` | Schema design, multi-tenancy, migrations & backups, DB/ORM choice, storage |
| `ai-engineering` | LLM cost control, output validation, evals, agent memory, vector stores |
| `observability` | Structured logs, error tracking, uptime alerting |
| `deployment-cicd` | Environments, branching, pipelines, canary, feature flags, rollback |
| `reliability-recovery` | Graceful failure, tested backups/restores, dependency resilience |
| `compliance-legal` | Privacy/terms, GDPR/CCPA, real deletion, SOC 2, app-store privacy |
| `api-architecture` | A real backend boundary; API contracts, versioning, changelogs |
| `frontend-mobile-quality` | Responsive, accessibility, performance, real-device bugs, deep links |
| `cost-infrastructure` | Tracing the bill, cost-per-user, hosting choice, self-host vs managed |
| `monetization-pricing` | Stripe integration, webhook security, pricing as a structural decision |

## Why "adaptive"?

Not every app has every concern. The `audit` skill profiles your app first — backend or not, database
or not, accounts, LLM calls, payments, mobile, expected traffic — and **skips what doesn't apply**
instead of crying wolf. You get a short, prioritized list aimed at *your* app, ranked by what actually
hurts if you ship it as-is.

## Contributing

Issues and PRs welcome — new checks, sharper examples, additional skills. Keep skills focused, written
in plain language, and follow the existing `SKILL.md` shape (frontmatter + When to Use + How It Works +
Examples + Do/Don't).

## License

[MIT](LICENSE).
