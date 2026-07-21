---
name: monetization-pricing
description: >
  Helps an app charge money correctly: integrating Stripe (hosted checkout plus the billing portal)
  instead of building billing from scratch, securing the events after payment (verifying webhook
  signatures, idempotent fulfilment, never returning 2xx for a failed charge), choosing a pricing
  model tied to customer value with a credit system, and treating pricing as a structural decision.
  Activates when the user mentions Stripe, billing, checkout, webhooks, payment callbacks, a pricing
  model, a credit system, silent revenue loss, or how to price the product. Applies only to apps
  that charge money.
user-invokable: true
metadata:
  category: monetization-pricing
  version: "2.0.0"
---

# Monetization & Pricing

Charging money is its own engineering area, and its failure mode is uniquely quiet: payment bugs
don't crash — they *smile and lose money*. A webhook that returns success on a failed charge shows
green dashboards while revenue leaks for hours. Treat the money path with checklist discipline.

Skip if the app is free. Freedom: **low on the webhook path** (money), medium on pricing strategy.

## Rules

| ID | Check | If it fails |
|---|---|---|
| PAY-01 | Billing integrated (hosted checkout + portal), not hand-built | P2 |
| PAY-02 | Webhook signatures verified — unsigned events rejected | P1 |
| PAY-03 | Fulfilment idempotent — a retried event can't double-charge or double-grant | P1 |
| PAY-04 | Failed charge never returns 2xx — provider retries or a DLQ captures it | P1 |
| PAY-05 | Full lifecycle handled: success, failure, refund, plan change | P2 |
| PAY-06 | Pricing decided from cost-to-serve + tiering (structural, not a guess) | P3 |
| PAY-07 | Usage events tracked from day one (enables usage/credit pricing later) | P3 |

## When to Use This Skill

- The app is adding payments/subscriptions, or mentions Stripe, checkout, a billing portal.
- User mentions webhooks, payment callbacks, signature verification, or duplicate charges.
- User reports revenue oddities with green dashboards (silent payment failure).
- User is choosing a pricing model, tiers, usage-based pricing, or a credit system.

## Checklist — the money path (run in order)

### 1. Don't build billing (PAY-01)
- [ ] **Stripe hosted checkout** + **billing portal** for subscriptions, upgrades, cancellations —
      removes most custom billing code (and most custom billing bugs).

### 2. The webhook path — where revenue silently dies (PAY-02..05)
- [ ] **Verify the signature** on every event; reject unsigned/invalid (never trust a bare POST).
- [ ] **Idempotent fulfilment**: key on the event/payment id; a retried event must not grant or
      charge twice.
- [ ] **Never return 2xx for a failed charge.** If your handler catches an error and answers `200`,
      the provider marks it delivered and won't retry — failed payments vanish silently and your
      error tracker sees nothing. Return non-2xx on failure so the provider retries, or capture the
      event in a **dead-letter queue** (→ `observability` OBS-08); reconcile against the provider's
      dashboard on a schedule.
- [ ] **Handle the whole lifecycle**: success, failure, refund, plan change, cancellation.

### 3. Pricing as structure (PAY-06, PAY-07)
- [ ] Price from **value delivered** and **cost-to-serve**; a **credit system** can simplify billing
      across features. A price that shuts out half your market is usually a tiering/architecture
      problem, not a number problem.
- [ ] **Price against the pain, not your comfort.** Most builders pick what "feels fair" ($20/mo).
      Do the customer's math instead: a user losing 3 hours/week at $50/hour burns ~$7,200/year on
      the problem — a tool that removes it is worth $150/month, not $20. Quantify the pain in the
      customer's currency, then price a fraction of it.
- [ ] **The sale is one sentence** — pain + resolution ("You spend three hours a week on
      scheduling; this does it in ten minutes"). Nobody reads a 12-feature list. If the product
      can't be stated as pain → resolution in one sentence, the pricing page isn't the problem.
- [ ] **Your first customers live where the complaints are** — not among your builder followers.
      Find the niche communities and threads where people complain about the problem you solve;
      that's the acquisition channel the product was born from.
- [ ] For API/usage products, **tiered rate limits are the pricing architecture** (→
      `api-architecture` API-06): the free tier generous enough to prove value, restrictive enough
      to create the upgrade. If free can do everything paid can, that's not a limit — it's a charity.
- [ ] **Track usage events from day one** — you can't price on usage you never measured
      (pairs with `llm-cost-control` metering).

## Fix playbook

```text
Webhook audit [PAY-02..04] — read the handler and check three lines:
 1. constructEvent(payload, sig, secret) present? → missing = PAY-02 P1.
 2. Fulfilment keyed on event.id (processed-events table / unique constraint)? → no = PAY-03 P1.
 3. catch block: does it return 200? → yes = PAY-04 P1. Change to 4xx/5xx (provider retries)
    or push the raw event to a DLQ before acking. Then add payments/hour alerting (OBS-06).
Reconciliation:
 daily job: provider's succeeded payments vs your fulfilled orders → alert on any diff.
```

## Examples

### Example 1: "How do I add subscriptions?"
**Output**:
```
[PAY-01] Stripe hosted checkout + portal. [PAY-02/03] verify signatures + idempotent fulfilment.
[PAY-04] failure path returns non-2xx (or DLQs). [PAY-05] handle refunds + plan changes.
```

### Example 2: "Revenue dropped but every dashboard is green"
**Output**:
```
Classic PAY-04: a handler catching errors and returning 200 — provider sees success, never
retries, nothing throws. Fix the failure path, add a DLQ, alert on payments/hour, reconcile
against the provider daily.
```

## Do / Don't

- **Do** use hosted checkout; verify signatures; key fulfilment on event ids.
- **Do** reconcile your orders against the provider on a schedule.
- **Don't** return 2xx for a failed charge — that's how revenue disappears silently.
- **Don't** hand-build billing or price before knowing cost-to-serve.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
