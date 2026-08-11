---
name: monetization-pricing
description: >
  Helps an app charge money correctly: integrating Stripe (hosted checkout plus the billing portal)
  instead of building billing from scratch, securing the events after payment (verifying webhook
  signatures, idempotent fulfilment, never returning 2xx for a failed charge), choosing a pricing
  model tied to customer value with a credit system, and treating pricing as a structural decision.
  Activates when the user mentions Stripe, billing, checkout, webhooks, payment callbacks, a pricing
  model, a credit system, silent revenue loss, how to price the product, or who the product is for
  (ICP, target customer, positioning). Applies to apps that charge money or intend to.
user-invokable: true
metadata:
  category: monetization-pricing
  version: "2.2.0"
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
| PAY-08 | Dispute defense ready: published refund policy, chargeback-rate alerts, response workflow | P1 (a freeze halts all payouts) |
| PAY-09 | Dunning built: staggered retries, failed-payment email sequence, grace period before cancel | P2 |
| PAY-10 | Transactional email actually delivers: SPF/DKIM, sending domain split from marketing, inbox-placement monitoring | P2 (P1 once charging — a missing receipt reads as fraud) |
| PAY-11 | Multi-currency checkout enabled when customers are international (processors support it; the default is one currency) | P2 if selling abroad |
| PAY-12 | ICP and positioning written down from real research before building — who you serve, what you deliver, how you differ | P3 (P2 pre-launch) |
| PAY-13 | If the buyer can be an agent: machine-readable product data, install-without-a-human packaging, and metered pricing an agent can transact | P3 (P2 if selling developer tools) |

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

### 3. Protect the revenue from disputes (PAY-08)
Your first chargeback can **freeze the entire payment-processor balance** — rent, payroll, servers —
so this exists before the first dispute, not after:
- [ ] A **published refund policy** matching your real terms, linked from checkout and visible
      before payment. With no published policy, the processor sides with the customer every time.
- [ ] **Chargeback-rate alerts** — processors let your dispute rate climb silently until it crosses
      their threshold, then act (fines, holds, termination). Monitor the trend so you fix the cause
      before they do.
- [ ] A **dispute-response workflow** prepared in advance — a template preloaded with transaction
      logs, delivery confirmations, and refund-policy screenshots. You get *days*, not weeks, to
      respond with evidence; panicking from zero loses winnable disputes.

### 4. Recover failed payments — dunning (PAY-09)
An expired card fails a renewal, the app does nothing, and the subscription dies silently — the
customer never knows. Lock the back door:
- [ ] **Staggered retries** over 7–14 days (not one-and-done) to catch temporary declines and cards
      that were reissued in that window. Stripe supports smart retries natively — enable them.
- [ ] A **failed-payment email sequence** ("your payment failed → update your card") — recovers
      ~30–40% of failed charges; the customer usually just doesn't know.
- [ ] A **grace period** (7–14 days active) before cancellation, not an instant cutoff on first
      failure.

### 5. Make the receipt arrive (PAY-10)
The charge lands, the confirmation email doesn't, and a customer is staring at a bank line from a
company they barely know with no proof of purchase — that's a chargeback and a cancellation, not a
support ticket. Deliverability is infrastructure the generator never configured:
- [ ] **SPF and DKIM on the sending domain** — without them, mail providers treat your receipts the
      way they treat phishing. It "works" in development because your test inbox doesn't care; the
      customer's provider does.
- [ ] **Split transactional from marketing sending** — one domain (or subdomain) for receipts,
      password resets, and alerts; another for newsletters. Otherwise marketing spam complaints
      poison the reputation that carries your receipts and password resets.
- [ ] **Monitor where mail actually lands** — a log line saying *delivered* only means a mail server
      accepted it, not that a human inbox received it. Track inbox placement and spam-complaint
      rates yourself; customers report deliverability failures via chargebacks, not emails
      (pairs with `observability` OBS-06 business-metric alerting).

### 6. Pricing as structure (PAY-06, PAY-07)
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

### 7. Know the customer before you build (PAY-12)
Pricing, positioning, and the landing page all derive from one thing most builders skip: knowing
exactly who this is for. Do it before the code, not after the silence:
- [ ] **Build the ICP from your actual background, not from a market that sounds profitable.** List
      what you genuinely know — an industry you worked in, a workflow you ran for years, a community
      you belong to — and find the segment where those advantages matter. Building for a lucrative
      market you've never lived in means competing on features against people who understand the
      customer better than you do.
- [ ] **Research the communities from the inside.** Join where those customers already gather and
      read before posting — you're there to learn, not to pitch. Decide what you're documenting
      first (competitors, pricing, recurring complaints, the words they use for the problem), then
      collect it: what's working, what isn't, and where your approach should deliberately differ.
- [ ] **Write a positioning document before the first line of code**: who you serve, what you
      deliver, how you differ, and where you compete. It becomes the source for the landing page,
      the one-sentence sale (above), the pricing tiers, and every sales conversation. Skip it and
      you build for yourself, then wonder why nobody shows up.

### 8. When the buyer is an agent (PAY-13)
If you sell to builders, a growing share of your buyers never see your landing page. They ask an
assistant to find, compare, and recommend a tool, and the assistant decides whether you're in the
set. Three consequences, none of them about design:
- [ ] **Be legible to machines first.** What decides whether you appear isn't the testimonial
      carousel — it's whether your product exists as **structured data** an AI search tool can
      index, parse, and rank: capabilities, constraints, pricing, and integration surface in a
      machine-readable form (→ `api-design` APID-10). If your value is only described in prose on a
      marketing page, you're invisible to the channel.
- [ ] **Package for integration, not for checkout.** Developer tools, wrappers, and integrations
      aren't bought, they're *installed*: the agent queries for a capability, reads the docs, checks
      the pricing, and wires it in — the whole transaction happening inside the development
      environment with no demo call and no funnel. That means real docs at a stable URL, a
      self-serve key, and a working call in under five minutes.
- [ ] **Price in units an agent can transact.** An agent doesn't sign up for a $49/month seat; it
      consumes what it needs when it needs it. Metered pricing — tokens per action, credits per
      query, value per outcome — is what makes you purchasable at all by that buyer. Keep the human
      plan; add a metered tier beside it (PAY-07's usage events are the prerequisite, and the cost
      side is `cost-infrastructure` COST-06).
- [ ] Sanity-check it the way the buyer does: ask a few assistants to recommend a tool in your
      category and see whether you're named, and what they say your pricing is.

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

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
