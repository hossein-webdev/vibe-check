---
name: cost-infrastructure
description: >
  Keeps infrastructure costs from quietly eating the margin: breaking down a hosting bill, tracing a
  jump to the service that caused it, choosing hosting by stage (Vercel/Railway/VPS), and weighing
  self-hosted against managed. Activates when the user mentions hosting costs, a cloud bill that
  jumped, cost per user, infrastructure spend, "where is my money going", or self-hosted vs managed
  trade-offs. For model/API spend specifically, use ai-engineering. Applies once infra usage is large
  enough to matter.
user-invokable: true
metadata:
  category: cost-infrastructure
---

# Cost & Infrastructure Economics

Infrastructure quietly drains revenue. A few hundred dollars a month against a small user base can take
a large slice of your income before you notice. Cost is a number you manage, not a surprise you receive.

Skip while usage is trivial. Otherwise, freedom: **medium** — adapt to the provider. (Model/API spend
lives in `ai-engineering`.)

## When to Use This Skill

- User mentions a hosting/cloud bill that's high or jumped.
- User asks "where is my money going?" or about cost per user.
- User is choosing hosting (Vercel vs Railway vs VPS) or sizing infrastructure.
- User is weighing **self-hosted vs managed**.

## How It Works

1. **Trace the bill before optimizing.** When the bill jumps, find the **service** responsible — go
   line by line across compute, bandwidth, storage, and managed add-ons, and identify the driver.
2. **Do the unit economics.** Compute **cost per user** against price per user. If infrastructure is a
   large fraction of revenue, that's a structural problem, not a rounding error — right-size, cache, or
   move the heavy and cold workloads.
3. **Match hosting to the stage.** Vercel, Railway, and a plain VPS have different cost curves and
   sweet spots. Early or spiky traffic favours managed/serverless; steady, heavy load favours cheaper
   dedicated compute. Revisit as you grow (graduation overlaps `deployment-cicd`).
4. **Choose self-hosted vs managed deliberately.** One costs money, the other costs time. Weigh your
   capacity to operate it, your uptime needs, and how much control you actually require — don't
   self-host to save cash you'll repay in operations.

## Examples

### Example 1: "My cloud bill doubled and I don't know why"
**Action**: Trace before optimizing.
**Output**:
```
1. Break the bill down by service (compute / bandwidth / storage / add-ons) and find the driver.
2. Compute cost-per-user vs price-per-user.
3. Right-size or cache the specific driver — don't optimize blind.
```

### Example 2: "Should I self-host to save money?"
**Action**: Trade time against money.
**Output**:
```
Self-hosting saves cash but costs operations time and adds reliability risk; managed costs more but
buys time. Decide on team capacity + uptime needs + required control — not on the sticker price alone.
```

## Do / Don't

- **Do** trace a bill to a specific service before optimizing.
- **Do** track cost per user and match hosting to your stage.
- **Don't** pick hosting by hype or self-host purely to shrink the invoice.
- **Don't** treat infrastructure as fixed — it scales with usage.
