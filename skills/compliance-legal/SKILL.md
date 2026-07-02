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

## When to Use This Skill

- The app collects personal data and has no privacy policy or terms.
- User mentions GDPR, CCPA, consent, opt-out, or the right to be forgotten.
- The app needs real account deletion, not a flag.
- An enterprise prospect asked for **SOC 2** or sent a security questionnaire.
- An app-store submission was (or might be) rejected for privacy.

## Checklist

### Baseline documents (LEGAL-01, LEGAL-02)
- [ ] **Privacy policy** and **terms of service** published before data collection starts.
- [ ] **Opt-out** flow (CCPA) and **deletion request** flow (GDPR/CCPA) exist and work end-to-end.
- [ ] Consent captured where required; retention periods defined.

### True deletion (LEGAL-03)
- [ ] Every table holding user data is mapped (the deletion inventory).
- [ ] Deletion cascades across all of them — profile, orders, logs, analytics links, backups policy.
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
