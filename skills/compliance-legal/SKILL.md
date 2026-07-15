---
name: compliance-legal
description: >
  Covers the legal and compliance work that makes a data-collecting app safe to sell and distribute:
  a privacy policy and terms, GDPR/CCPA opt-out and deletion, deletion that actually clears data
  across every table, SOC 2 readiness for enterprise deals, and app-store privacy requirements.
  Activates when the user mentions a privacy policy, terms of service, GDPR, CCPA, data deletion,
  consent, SOC 2, enterprise security questionnaires, or app-store rejections for privacy. Applies
  to apps that collect personal data, sell B2B, or ship to an app store.
user-invokable: true
metadata:
  category: compliance-legal
  version: "2.0.0"
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
