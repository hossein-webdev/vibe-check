---
name: production-readiness
description: >
  Closes the gap between an app that demos well and one that holds up for real users. Most AI-built
  apps ship about two layers (a UI and a database) of the dozen-plus a real product needs — and
  AI-generated code carries 2-3x the vulnerabilities. Activates when a build "works for me
  but breaks for everyone else", is stuck at the "almost done" stage, when the owner can't explain
  or maintain AI-generated code, when a developer is being brought in to take it over, when someone
  asks what to build next while existing features are broken, when a build is about to reach its
  first customer, or when someone asks what unglamorous work is left before launch. Covers the last
  mile of shipping, owning the generated code, lightweight docs, feature health audits, the
  pre-release audit gate, and right-sizing effort to the app's stage.
user-invokable: true
metadata:
  category: production-readiness
  version: "2.2.0"
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
| PROD-06 | Work queued by business risk (money / data / legal) — audit first, then fix in priority order | P2 |
| PROD-07 | Feature health known before the next feature is built: what's live, what's broken, what has zero adoption — broken-and-used fixed first | P2 |
| PROD-08 | No customer reaches a build that hasn't passed a structured pre-release audit, with the pass/fail result recorded | P1 before first customer, then per release |

## When to Use This Skill

- Someone says "it works on my machine / in the demo but breaks for real users".
- A project is "almost done" but stalled on the unglamorous remainder.
- The owner (often non-technical) can't explain what the generated code does.
- A new developer is taking over an AI-built codebase.
- Someone asks "what's left that isn't a feature?" before launch.
- Someone asks what to build next while existing features are broken or unused.
- A build is about to reach its first customer, or a release is about to go out.

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
     incident response (who's notified, what's locked down, how customers are told);
   - **know where automation stops (the 70/30 split)**: playbooks auto-resolve roughly 70% — but
     the 30% that decides whether customers stay needs human judgment: the billing dispute where
     the customer is right and the system disagrees (check the dashboard, find the duplicate,
     refund, acknowledge); the feature request disguised as a bug report (works as designed, read
     the intent); the angry email that isn't about the stated issue (read the history, pick up the
     phone). Build the 70% precisely to buy time for the 30% — that's where trust is earned.
7. **Break the endless-debugging loop (PROD-06).** The weekend build followed by three months of
   debugging isn't failure — it's the gap between *building* and *engineering* becoming visible. You
   asked the generator to build; you never asked it to verify, secure, or handle the unexpected, so
   each week surfaces another missing layer. The hole was always that deep. Two moves end the loop:
   - **Audit the whole stack before fixing anything else** — map every area at once instead of
     chasing whatever broke most recently (run `audit`).
   - **Queue by business risk, not recency** — what can *lose money*, *lose data*, or *get you sued*
     goes first; everything else takes a number. That's the difference between panicked debugging
     and engineering with a plan.
8. **Fix before you build (PROD-07).** Building the next feature *feels* like progress; fixing the
   last one feels like going backwards — and with a generator that will happily build anything you
   ask, that instinct compounds into a product where nothing quite works. Three reasons to invert it:
   - **Every feature stacks on the foundation underneath it.** Notifications on top of an auth flow
     that silently drops sessions, a reporting dashboard on top of an unindexed table — the
     generator builds what you asked without ever asking whether the thing below can hold the
     weight. Each addition makes the system more fragile, not more valuable.
   - **Customers aren't asking for more features.** Read the support inbox: nobody writes "I wish
     this had more features", they write "this doesn't work the way I expected". New features
     attract customers; broken ones lose the customers you already paid to acquire — and losing
     costs more than delaying.
   - **Run a feature health audit before the next build.** List every shipped feature in three
     columns: *works*, *broken/half-finished*, *used vs zero adoption* (usage data, not memory).
     Then: **broken + used → fix first**; **broken + unused → delete it**, because dead code is
     surface area you still maintain and secure; **works + unused → find out why** before building
     its successor. Only what survives that pass earns the next sprint.
9. **Inspect before occupancy (PROD-08).** Every industry where people can be harmed puts a check
   between *we built it* and *people use it* — a kitchen isn't served from until it's inspected, a
   building isn't occupied without sign-off, wiring isn't energised without a final check. Software
   is the exception: a generator pours the foundation over a weekend and the first paying customer
   moves in on Monday, with nobody having looked at the schema, the auth flow, or the API boundary.
   A failed foundation in construction gets torn out before anyone steps inside; in software it
   fails silently while customers live on top of it.
   - **Make the audit a gate, not an activity.** Run the structured pass (`audit`) *before* the next
     customer arrives, and again before each meaningful release. The point isn't the score — it's
     that passing and failing are both recorded, so "we didn't know" stops being available.
   - **Record the result with the release.** What passed, what failed, what was accepted as a known
     risk and by whom. That record is what turns a scramble into a decision when something breaks,
     and it's most of what a buyer's security review asks for anyway (→ `compliance-legal`
     LEGAL-09).
   - **The direction of travel favours you.** Disclosure and safety obligations for software —
     especially anything shipping model-generated content — keep tightening
     (→ `compliance-legal` LEGAL-13/14/15). Builders already inspecting before occupancy absorb each
     new requirement as a checklist line; builders who aren't will retrofit under deadline.
   - This is not PROD-06. That one orders the work *after* you know what's broken; this one is the
     gate that stops an uninspected build reaching a customer in the first place.
10. **Dispatch the specifics.** Run `audit` to see which layers apply; this skill sets the posture,
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
Release gate [PROD-08] — before the next customer or release:
 1. Run the structured audit; capture the score + the failing rule IDs into the release notes.
 2. P1s block the release. P2s ship only as a written accepted risk with an owner and a date.
 3. Store the record with the tag (RELEASE_AUDIT.md or the release body) — dated, not remembered.
Feature health audit [PROD-07] — before the next feature, one table:
 | feature | works? | active users (last 30d) | verdict |
 1. Fill "works?" by actually running each flow, not from memory.
 2. Fill users from analytics/DB counts — zero adoption is a finding, not a blank.
 3. Verdict: broken+used = fix now · broken+unused = delete · works+unused = investigate.
 4. Only start new work after the "fix now" column is empty.
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

### Example 3: "What should I build next?"
**Output**:
```
[PROD-07] Nothing, until the feature health audit is done: every shipped feature scored works /
broken / used. Broken-and-used gets fixed first, broken-and-unused gets deleted. Building on top
of a broken layer makes the product more fragile, and the support inbox is asking for the existing
features to work — not for more of them.
```

## Do / Don't

- **Do** treat the unglamorous 20% as the main work; make the owner able to explain every file.
- **Do** match effort to stage (1k features / 10k operations / 100k architecture).
- **Do** treat the audit as a release gate with a recorded result — inspection before occupancy.
- **Do** audit feature health before starting the next feature — fix broken-and-used, delete
  broken-and-unused.
- **Don't** mistake "the happy path works" for "ready" — you may have 2 of 13 layers.
- **Don't** let a customer be the first thing that inspects your build.
- **Don't** stack a new feature on a foundation you know is broken; it multiplies the fragility
  instead of adding value.
- **Don't** ship AI code unreviewed; it carries 2–3× the vulnerabilities.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
