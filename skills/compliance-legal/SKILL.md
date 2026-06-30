---
name: compliance-legal
description: >
  Covers the legal and compliance work that makes a data-collecting app safe to sell and distribute: a
  privacy policy and terms, GDPR/CCPA opt-out and deletion, deletion that actually clears data across
  every table, SOC 2 readiness for enterprise deals, and app-store privacy requirements. Activates when
  the user mentions a privacy policy, terms of service, GDPR, CCPA, data deletion, consent, SOC 2,
  enterprise security questionnaires, or app-store rejections for privacy. Applies to apps that collect
  personal data, sell B2B, or ship to an app store.
user-invokable: true
metadata:
  category: compliance-legal
---

# Compliance & Legal

As soon as an app collects personal data it carries legal exposure, and "we'll deal with it later"
quietly blocks both enterprise deals and app-store approval. This is precise, document-driven work.

Skip if the app collects no personal data and won't be distributed/sold. Otherwise, freedom: **low** —
these are requirements, not preferences.

## When to Use This Skill

- The app collects personal data and has no privacy policy or terms of service.
- User mentions GDPR, CCPA, consent, opt-out, or the right to be forgotten.
- The app needs **real** account deletion, not a soft-delete flag.
- An enterprise prospect asked for a **SOC 2** report or sent a security questionnaire.
- An app-store submission was, or may be, rejected for privacy reasons.

## How It Works

1. **Publish the baseline documents.** A **privacy policy** and **terms of service** before you collect
   data, plus working **opt-out** and **data-deletion** flows for GDPR/CCPA. Skipping these turns a
   launch into exposure quickly.
2. **Delete data for real.** Removing a user means clearing their data across **every related table**,
   not flipping one flag. Inventory what you collect, capture **consent**, set **retention**, and make
   deletion cascade — then document it.
3. **Get SOC 2-ready for enterprise sales.** SOC 2 is a trust report, not a product feature, and it has
   a long lead time. Start early: access controls, audit logging, and change management in place, with
   evidence collected continuously. When a prospect asks, share a credible timeline rather than scrambling.
4. **Handle app-store privacy.** A meaningful share of submissions are rejected, many specifically over
   privacy. Line up your data-use disclosures, permission justifications, and the privacy-policy link
   before you submit.

## Examples

### Example 1: "I just launched and I'm collecting emails and usage data"
**Action**: Stand up the legal baseline.
**Output**:
```
Before promoting it:
1. Publish a privacy policy + terms of service.
2. Add GDPR/CCPA opt-out and a data-deletion request flow.
3. Map every table that stores user data so deletion truly removes all of it.
```

### Example 2: "An enterprise lead asked for our SOC 2"
**Action**: Set expectations and start collecting evidence.
**Output**:
```
SOC 2 has a long runway — you can't produce it overnight.
Start now: access controls, audit logging, change management, and continuous evidence collection.
Give the prospect a timeline instead of scrambling.
```

## Do / Don't

- **Do** publish privacy/terms and build genuine opt-out + deletion before scaling.
- **Do** treat deletion as cross-table removal with defined retention and consent.
- **Don't** soft-delete and call it "deleted".
- **Don't** wait for a deal to start SOC 2 evidence — by then it's too late.
