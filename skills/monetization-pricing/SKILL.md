---
name: monetization-pricing
description: >
  Helps an app charge money correctly: integrating Stripe (hosted checkout plus the billing portal)
  instead of building billing from scratch, securing the events after payment (verifying webhook
  signatures, preventing duplicate charges), choosing a pricing model tied to customer value with a
  credit system, and treating pricing as a structural decision. Activates when the user mentions
  Stripe, billing, checkout, webhooks, a pricing model, a credit system, or how to price the product.
  Applies only to apps that charge money.
user-invokable: true
metadata:
  category: monetization-pricing
---

# Monetization & Pricing

Charging money is its own area. Building billing from scratch is wasted effort, and a price chosen late
is often really a structural decision in disguise.

Skip if the app is free. Otherwise, freedom: **medium** — adapt to the business.

## When to Use This Skill

- The app is adding payments/subscriptions, or the user mentions Stripe, checkout, or a billing portal.
- User mentions webhooks, signature verification, or duplicate charges.
- User is choosing a pricing model, tiers, usage-based pricing, or a credit system.
- User asks "how should I price this?" or is setting a price point.

## How It Works

1. **Integrate billing, don't build it.** Use **Stripe hosted checkout** plus the **billing portal**
   for subscriptions, upgrades, and cancellations — that removes most custom billing code.
2. **Secure what happens after payment.** Stripe processes the payment; you own the aftermath:
   - **verify webhook signatures** (never trust an unsigned webhook),
   - make fulfilment **idempotent** so a retry doesn't charge or grant twice,
   - handle the full lifecycle: success, failure, refund, plan change.
3. **Tie the model to value.** Align price with the value the customer receives; a **credit system** can
   simplify billing across features. **Track usage events from day one** so usage-based or credit pricing
   is accurate later.
4. **Treat pricing as structure.** A price that shuts out a large part of your market is usually a
   structural issue — cost-to-serve, tiering, regional pricing — not just a number. Work out your
   cost-to-serve and tiers before you set the price.

## Examples

### Example 1: "How do I add subscriptions?"
**Action**: Stripe-first, secure the webhooks.
**Output**:
```
1. Stripe hosted checkout + billing portal — don't hand-roll the billing UI.
2. Verify webhook signatures; make fulfilment idempotent (no duplicate charges/grants).
3. Handle the lifecycle: payment success/failure, refunds, plan changes.
```

### Example 2: "Is this price right?"
**Action**: Reframe as structure + value.
**Output**:
```
If the price shuts out much of your market, that's a structure/tiering problem, not just a number.
Know your cost-to-serve per user, then design tiers (maybe a credit model) around the value delivered.
Track usage events now so you can price accurately later.
```

## Do / Don't

- **Do** use hosted checkout and verify webhook signatures.
- **Do** track usage from day one and tie price to value.
- **Don't** build custom billing or trust an unsigned webhook.
- **Don't** set a price before you understand cost-to-serve and tiering.
