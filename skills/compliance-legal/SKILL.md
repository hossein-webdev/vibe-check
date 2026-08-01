---
name: compliance-legal
description: >
  Covers the legal and compliance work that makes a data-collecting app safe to sell and distribute:
  a privacy policy and terms, GDPR/CCPA opt-out and deletion, deletion that actually clears data
  across every table, SOC 2 readiness for enterprise deals, and app-store privacy requirements.
  Activates when the user mentions a privacy policy, terms of service, GDPR, CCPA, data deletion,
  consent, SOC 2, enterprise security questionnaires, accessibility law (ADA, WCAG conformance,
  VPAT), or app-store rejections for privacy. Applies to apps that collect personal data, sell B2B,
  ship to an app store, or are publicly accessible.
user-invokable: true
metadata:
  category: compliance-legal
  version: "2.1.0"
---

# Compliance & Legal

As soon as an app collects personal data it carries legal exposure, and "we'll deal with it later"
quietly blocks both enterprise deals and app-store approval. This is precise, document-driven work.

Skip if no personal data is collected and no store/B2B distribution is planned. Freedom: **low** —
these are requirements, not preferences.

## Rules

| ID | Check | If it fails |
|---|---|---|
| LEGAL-01 | Privacy policy + terms of service published before collecting data | P1 once public |
| LEGAL-02 | GDPR/CCPA opt-out and a working data-deletion request flow | P1 in covered markets |
| LEGAL-03 | Deletion truly removes data across **every** related table (not a soft-delete flag) | P2 |
| LEGAL-04 | SOC 2 evidence collection started early (access controls, audit logging, change mgmt) | P2 if selling B2B |
| LEGAL-05 | App-store privacy package ready (disclosures, permission justifications, policy link) | P2 if store-bound |
| LEGAL-06 | Cyber liability insurance in place once you hold others' data (underwriters require security basics) | P2 at launch |
| LEGAL-07 | Platform ToS read: you know each provider's liability cap and your exposure above it | P3 |
| LEGAL-08 | Pre-revenue document set complete: ToS, privacy policy, DPA, refund policy, MSA (B2B) | P2 before first payment |
| LEGAL-09 | Security-questionnaire answers prepared + a public security page (before the questionnaire arrives) | P2 if selling B2B |
| LEGAL-10 | Retention obligations mapped: law-required records kept (separate from user-controlled data), with an audit trail | P1 in regulated sectors |
| LEGAL-11 | Sales-tax/VAT exposure mapped; tax collected at checkout; remittance calendar in place | P1 once selling across jurisdictions |
| LEGAL-12 | Health data (HIPAA/PHI): encrypted everywhere incl. logs/backups/exports, per-record access audit trail, BAAs with every third party | P1 if the app touches health data |
| LEGAL-13 | Accessibility conformance documented (WCAG 2.1 AA target, dated audit, remediation plan) | P2 for public-facing products; P1 for government, education, healthcare, and public-accommodation sectors |

## When to Use This Skill

- The app collects personal data and has no privacy policy or terms.
- User mentions GDPR, CCPA, consent, opt-out, or the right to be forgotten.
- The app needs real account deletion, not a flag.
- An enterprise prospect asked for **SOC 2** or sent a security questionnaire.
- An app-store submission was (or might be) rejected for privacy.

## Checklist

### Baseline documents (LEGAL-01, LEGAL-02)
- [ ] **Privacy policy** and **terms of service** published before data collection starts.
- [ ] **The policy matches what the app actually does.** A template copied from the internet that
      talks about cookies — while the app collects emails, payments, and usage data — is a
      compliance violation waiting for its first GDPR deletion request against a database that was
      never built for deletion. Draft the policy from your real data inventory.
- [ ] **Opt-out** flow (CCPA) and **deletion request** flow (GDPR/CCPA) exist and work end-to-end.
- [ ] Consent captured where required; retention periods defined.

### Protect the business itself (LEGAL-06, LEGAL-07)
- [ ] **Cyber liability insurance** once you hold other people's data — a breach on an uninsured
      platform means notification, remediation, legal fees, and damages out of *your* pocket (the
      LLC won't always shield you). Coverage runs roughly $200–600/year for a small SaaS versus a
      five-figure breach. Note: **underwriters require security basics before covering you** —
      vulnerability scans, access controls, encryption at rest — so the security audit
      (→ `app-security`) is an insurance prerequisite, not just hygiene.
- [ ] **Read your platforms' terms of service.** Most include limitation-of-liability clauses that
      cap the provider's exposure at *what you paid them last month* — their $25 versus your $10k
      loss when their outage eats your data. Know each cap, and cover the gap with backups
      (→ `reliability-recovery`) and insurance, because the platform won't.

### The pre-revenue document set (LEGAL-08)
Before accepting the first payment, six documents — none of them code, all of them protecting the
business under the code. AI can draft each one, but only directed with *your* specifics (a
downloaded template protects nobody):
- [ ] **Terms of Service** — what users may do, your liability boundaries, what happens when things
      go wrong.
- [ ] **Privacy policy** — matching reality (LEGAL-01 above).
- [ ] **DPA (data processing agreement)** — required by GDPR when you process data on behalf of
      another business; enterprise customers ask for it every time.
- [ ] **Refund policy** — payment processors require one; customer trust depends on it.
- [ ] **MSA (master service agreement)** — for B2B: SLAs, uptime guarantees, response times, and
      what happens when it breaks.
- [ ] **Cyber liability insurance** (LEGAL-06 above) — the document set's backstop.

### True deletion (LEGAL-03)
"Delete" is a business process, not a button — the generator built login, not deletion:
- [ ] **Cascade map first**: chart every table relationship touching the user (orders, messages,
      uploads, payments, sessions, tickets) *before* the first deletion request arrives.
- [ ] **Soft-delete with a retention window**: deactivate immediately, retain ~30 days for
      compliance review, then **automatic** hard delete — no manual cleanup.
- [ ] **Report on demand**: you can generate a complete report of everything held on a user and
      confirm removal within the regulatory window — if you can't produce that report, you have
      legal exposure you don't know about.
- [ ] The flow is documented and tested with a real account.

### Retention — the flip side of deletion (LEGAL-10)
Deletion and retention coexist and can conflict: some records you're **legally required to keep**
(financial services, healthcare, tax, some legal agreements often demand retention up to ~7 years
after the relationship ends), so a hard delete on request can *break the law*. A generator lumps all
data together unless told not to:
- [ ] **Separate the two categories.** User-controlled data → anonymize/delete on request;
      law-required records → a separate retention layer, locked, with an expiration date attached.
- [ ] **Map a retention schedule to your actual obligations** — it varies by industry, jurisdiction,
      and record type (payment records ≠ user communications). This requires research specific to
      your business; nothing decides it for you.
- [ ] **Keep an audit trail** proving what was retained vs anonymized, when the clock started, and
      when it expires — when a regulator asks (and in regulated sectors they will), a policy without
      logs is a promise with no proof.
- [ ] Reconcile with the deletion flow above: a GDPR/CCPA deletion request must purge the
      user-controlled data while leaving the legally-mandated records in the retention layer.

### The security questionnaire (LEGAL-09)
The buyer's security team evaluates you **before** the contract — and a failed questionnaire ends
deals with silence, not rejection:
- [ ] **Answers prepared in advance**: encryption at rest and in transit, vulnerability-scan
      cadence, date of the last pen test, a shareable incident-response plan, data residency.
- [ ] **Audit → fix → pen test → re-audit** — never start with the pen test. A full-stack
      production audit (→ the `audit` skill) finds what's broken before you pay someone to attack
      it; the pen test validates the fixes; the re-audit confirms they held. The audit scorecard +
      pen-test report together answer more procurement questions than any sales deck.
- [ ] **A public security page** — encryption posture, audit cadence, pen-test schedule, IR plan,
      how to report a vulnerability. Costs nothing, answers half the questionnaire preemptively.

### Health data — HIPAA and equivalents (LEGAL-12)
The moment the app touches protected health information — patient records, student health data — it
falls under federal regulation, and the generator never asks. Penalties scale from roughly $100 per
violation into the millions, and a single complaint can trigger an investigation:
- [ ] **Encrypt PHI at rest and in transit — everywhere it lands.** Not just the database:
      **backups, logs, and exports** too. The classic failure is an encrypted database with PHI
      sitting in plain text in application logs; one log file is enough.
- [ ] **Access controls *plus* an audit trail per record** — who accessed it, when, from where, and
      what they did. Regulators expect this on demand, and role-based access without the paper trail
      doesn't satisfy the requirement.
- [ ] **A BAA (business associate agreement) with every third party that can see PHI** — hosting,
      email, analytics, error tracking. Integrating six services and signing zero agreements means
      their breach becomes your liability with no contract defining obligations.
- [ ] Same shape applies to other regulated data (financial, children's, biometric) — identify which
      regime you're under *before* launch, not after the first complaint.

### Accessibility as legal exposure (LEGAL-13)
Accessibility is usually filed under design polish; in most jurisdictions it is **law**. Public-facing
digital products are treated as places of public accommodation (ADA in the US, EN 301 549 / the
European Accessibility Act in the EU, AODA in Ontario, and equivalents elsewhere), and web
accessibility claims are among the cheapest to file — plaintiffs need no injury beyond an inaccessible
page. A generator has never heard of WCAG:
- [ ] **Pick the target and write it down: WCAG 2.1 Level AA.** It's the standard courts, procurement
      teams, and regulators reference. "We try to be accessible" is not a target.
- [ ] **Get a dated audit against that target** and keep the report. The technical work is
      `frontend-mobile-quality` FE-02/FE-07/FE-08 (keyboard operability, screen-reader semantics,
      contrast); this rule is about having the *evidence*.
- [ ] **Publish an accessibility statement** — conformance target, known gaps, remediation timeline,
      and a contact route for accessibility problems. A documented plan with open items is a far
      better legal posture than silence, and it often resolves a complaint before it becomes a claim.
- [ ] **Remediate on a schedule and log it.** Demonstrated good-faith progress is what distinguishes
      a defensible position from an indefensible one; an untouched audit report is worse than none.
- [ ] **Know your sector's floor.** Government, education, healthcare, and companies selling into
      them face procurement requirements (VPAT/ACR requests) on top of general law — expect the
      question during the same review that asks for SOC 2 (LEGAL-09).

### Sales tax / VAT (LEGAL-11)
Selling a digital subscription to a customer in another state or country can create a tax obligation
*there* — in the US it's called economic **nexus**, and the generator never raises it because it
doesn't know the term or your footprint. The letter from a revenue department is the usual first
notice:
- [ ] **Map exposure** — pull the customer list by jurisdiction and compare against each one's
      threshold. They differ wildly (roughly $100k in revenue in some states, ~200 transactions in
      others, the first dollar of digital goods in a few; VAT/GST rules elsewhere have their own
      registration triggers).
- [ ] **Collect at checkout** — Stripe Tax and its equivalents are built into the processor you
      already use, but stay **off** unless you enable them. Wiring it up is an afternoon; unwinding
      years of uncollected obligations is not.
- [ ] **Keep a remittance calendar** — collecting without remitting is a liability, not an oversight.
      Every jurisdiction sets its own filing frequency, deadlines, and late penalties.
- [ ] **Verify against your own jurisdictions** — thresholds and digital-goods rules change; treat
      this checklist as the prompt to confirm, not as tax advice.

### Enterprise readiness (LEGAL-04)
- [ ] SOC 2 understood as a **trust report with a long runway** — not a feature you add in a week.
- [ ] Access controls, audit logging, and change management enabled **now**; evidence collected
      continuously so the audit period is already behind you when a prospect asks.
- [ ] A credible timeline ready to hand a prospect instead of a scramble.

### App-store privacy (LEGAL-05)
- [ ] Data-use disclosures and permission justifications drafted before submission.
- [ ] Privacy-policy link wired into the store listing and the app.
- [ ] A privacy/security self-review done — a meaningful share of rejections are privacy-based.

## Fix playbook

```text
Just launched, collecting emails+usage [LEGAL-01/02]:
 1. Publish privacy policy + ToS (generator drafts are fine; review the data-use section honestly).
 2. Add /privacy request endpoints: export + delete; log requests + completions.
Deletion audit [LEGAL-03]:
 1. SELECT table_name FROM information_schema.columns WHERE column_name IN ('user_id','email');
 2. Write the cascade (FK ON DELETE / explicit job); run it on a test account; verify zero rows remain.
Enterprise asked for SOC 2 [LEGAL-04]:
 1. Turn on: SSO/2FA + least-privilege access, audit logs, PR-based change management.
 2. Start evidence collection (screenshots/exports on a schedule); reply with the timeline.
Accessibility exposure [LEGAL-13]:
 1. State the target: WCAG 2.1 AA. 2. Audit against it (→ frontend-mobile-quality FE-02/07/08); keep the dated report.
 3. Publish an accessibility statement: target, known gaps, timeline, contact route.
 4. Work the remediation list on a schedule and log each fix — good-faith progress is the defense.
```

## Examples

### Example 1: "I just launched and I'm collecting emails and usage data"
**Output**:
```
[LEGAL-01/02] Before promoting: privacy policy + ToS live; opt-out + deletion request flows working.
[LEGAL-03] Map every table with user data so deletion actually clears it.
```

### Example 2: "An enterprise lead asked for our SOC 2"
**Output**:
```
[LEGAL-04] It's a trust report with a long runway. Start evidence now (access controls, audit
logging, change management) and give the prospect a timeline — scrambling reads as a red flag.
```

## Do / Don't

- **Do** publish privacy/terms and build genuine opt-out + deletion before scaling.
- **Do** treat deletion as a cross-table cascade with a tested proof.
- **Don't** soft-delete and call it "deleted".
- **Don't** wait for the deal to start SOC 2 evidence — by then it's too late.
- **Don't** treat accessibility as design polish — name WCAG 2.1 AA as the target, audit against it,
  and publish the statement.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
