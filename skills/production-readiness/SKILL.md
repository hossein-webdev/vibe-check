---
name: production-readiness
description: >
  Closes the gap between an app that demos well and one that holds up for real users. Most AI-built
  apps ship about two layers (a UI and a database) of the dozen-plus a real product needs — and
  AI-generated code carries 2-3x the vulnerabilities. Activates when a build "works for me
  but breaks for everyone else", is stuck at the "almost done" stage, when the owner can't explain
  or maintain AI-generated code, when a developer is being brought in to take it over, or when
  someone asks what unglamorous work is left before launch. Covers the last mile of shipping,
  owning the generated code, lightweight docs, and right-sizing effort to the app's stage.
user-invokable: true
metadata:
  category: production-readiness
  version: "2.0.0"
---

# Production Readiness — The Last Mile

Here's the shape of the problem: a production system is a **stack of a dozen-plus layers** — UI,
API boundary, schema, auth, deployment, compute, CI, security, caching, scaling, monitoring,
recovery. Most AI-built apps ship exactly **two** of them: a front-end and a database. The missing
layers are what separate a demo from a product. And the code in the two layers you have isn't free
either: **AI-generated code carries two to three times the vulnerabilities** of reviewed code (recent
measurements put it around 2.7×) — the job isn't generating software anymore, it's *hardening* it.

This skill is that posture — ownership and discipline. The `audit` skill maps which layers you're
missing; the domain skills fill them.

Freedom: **high** — principles to adapt, not rigid steps.

## Rules

| ID | Check | If it fails |
|---|---|---|
| PROD-01 | Core flow completed cold by someone who didn't build it; app survives hostile input | P1 |
| PROD-02 | Owner can explain every file; misleading names fixed; dead generated code removed | P2 |
| PROD-03 | Non-obvious knowledge written down (decisions+why, env/secrets setup, shortcuts) | P2 |
| PROD-04 | Effort matches stage (features → operations → architecture as users grow) | P3 |
| PROD-05 | Support system exists before the first customer: per-feature playbooks + tiered escalation | P2 at launch |

## When to Use This Skill

- Someone says "it works on my machine / in the demo but breaks for real users".
- A project is "almost done" but stalled on the unglamorous remainder.
- The owner (often non-technical) can't explain what the generated code does.
- A new developer is taking over an AI-built codebase.
- Someone asks "what's left that isn't a feature?" before launch.

## How It Works

1. **Name the gap.** The quick 80% is the path where everything goes right. The remaining 20% —
   validation, error/empty states, retries, deploy-and-recover — is the actual engineering, and
   it's where demos die. Budget for it explicitly.
2. **Pressure-test like a stranger (PROD-01).** You know the one path that works; users don't:
   - someone who *didn't* build it tries it cold,
   - feed it bad, slow, huge, and empty inputs on purpose,
   - add the boring non-features it surfaces (validation, fallbacks, friendly errors).
3. **Own the generated code (PROD-02).** You can't operate what you can't explain:
   - read every file; understand what it does,
   - rename anything whose name lies about its job,
   - delete the dead and duplicated code the generator left.
4. **Write down the non-obvious (PROD-03)**, while it's fresh: key decisions and *why*; environment,
   secrets, and external services setup; deliberate shortcuts and their reasons. This is the gap
   that makes hired developers bounce off AI-built codebases.
5. **Right-size to stage (PROD-04).** The skills the app needs shift with scale:
   - **~1,000 users** → shipping features is the job,
   - **~10,000 users** → reliability and operational practice dominate,
   - **~100,000 users** → architecture is the job.
   Don't build for 100k while you have 100 — and don't stay in feature-mode once people depend on you.
6. **Build the support system with the product (PROD-05).** The AI built the app; nobody told it to
   build the support system — and at 2am when a paying customer can't log in, that gap kills more
   launches than bad code:
   - **a support playbook ships with every feature, same sprint** — login: password resets, expired
     tokens, locked accounts; payments: failed charges, missed webhooks, subscription issues. These
     are minimum production deliverables, not afterthoughts;
   - **wire real-time production signals** so known issues with documented fixes can be resolved
     automatically and unknown ones arrive packaged with context;
   - **define the tiers before the first customer**: T1 automated resolution (most volume never
     reaches you), T2 assisted triage (context packaged, you decide, the playbook grows), T3
     incident response (who's notified, what's locked down, how customers are told).
7. **Dispatch the specifics.** Run `audit` to see which layers apply; this skill sets the posture,
   the domain skills do the work.

## Fix playbook

```text
"Basically done, just polishing" [PROD-01]:
 - [ ] Stranger completes the core flow unaided
 - [ ] Survives: bad input · offline · empty data · huge data
 - [ ] Error/empty/loading states exist
 - [ ] Deploy + rollback path exists (→ deployment-cicd)
Unmaintainable handover [PROD-02/03]:
 1. Walk every file; rename misleading names; delete dead code.
 2. Write 3 docs: decisions+why · env/secrets setup · known shortcuts+why.
```

## Examples

### Example 1: "It's basically done, just polishing"
**Output**:
```
"Done" means the checklist above passes — until then it's a demo wearing a product's clothes.
You've likely built 2 of ~13 layers; run the audit to see which of the other 11 apply.
```

### Example 2: "A dev I hired says the code is unmaintainable"
**Output**:
```
[PROD-02/03] Ownership pass: rename to real intent, delete dead code, write the 3 docs
(decisions, env setup, shortcuts). That documentation gap — not the code style — is usually
why handed-over AI codebases feel hostile.
```

## Do / Don't

- **Do** treat the unglamorous 20% as the main work; make the owner able to explain every file.
- **Do** match effort to stage (1k features / 10k operations / 100k architecture).
- **Don't** mistake "the happy path works" for "ready" — you may have 2 of 13 layers.
- **Don't** ship AI code unreviewed; it carries 2–3× the vulnerabilities.
