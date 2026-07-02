---
name: cost-infrastructure
description: >
  Keeps infrastructure costs from quietly eating the margin: breaking down a hosting bill, tracing a
  jump to the service that caused it, computing cost per user against price per user, choosing
  hosting by stage (Vercel/Railway/VPS), and weighing self-hosted against managed. Activates when
  the user mentions hosting costs, a cloud bill that jumped, cost per user, infrastructure spend,
  "where is my money going", or self-hosted vs managed trade-offs. For model/API spend specifically,
  use llm-cost-control. Applies once infra usage is large enough to matter.
user-invokable: true
metadata:
  category: cost-infrastructure
  version: "2.0.0"
---

# Cost & Infrastructure Economics

Infrastructure quietly drains revenue: a few hundred dollars a month against a small user base can
swallow half the income before anyone notices. Cost is a number you manage, not a surprise you
receive.

Skip while usage is trivial. Model/API spend → `llm-cost-control`. Freedom: **medium**.

## Rules

| ID | Check | If it fails |
|---|---|---|
| COST-01 | Bill attributable per service (compute/bandwidth/storage/add-ons) | P2 when bills surprise |
| COST-02 | Cost per user known and compared to price per user | P2 |
| COST-03 | Hosting matches the stage (managed/serverless early; dedicated when steady-heavy) | P3 |
| COST-04 | Self-hosted vs managed decided on team capacity + uptime needs, not sticker price | P3 |

## When to Use This Skill

- User mentions a hosting/cloud bill that's high or jumped.
- User asks "where is my money going?" or about cost per user.
- User is choosing hosting (Vercel vs Railway vs VPS) or sizing infrastructure.
- User is weighing self-hosted vs managed.

## How It Works

1. **Trace before optimizing (COST-01).** When a bill jumps, find the **service** responsible —
   line by line: compute, bandwidth, storage, managed add-ons. Optimizing blind wastes the effort.
2. **Do the unit economics (COST-02).** Cost per user vs price per user. If infrastructure is a
   large fraction of revenue, that's a structural problem — right-size, cache, move heavy/cold
   workloads — not a rounding error.
3. **Match hosting to stage (COST-03).** Vercel, Railway, and a VPS have different cost curves:
   early/spiky → managed/serverless convenience; steady/heavy → cheaper dedicated compute. Revisit
   as you grow (graduation overlaps `deployment-cicd` DEPLOY-08).
4. **Self-hosted vs managed, deliberately (COST-04).** One costs money, the other costs time. Weigh
   team capacity to operate it, uptime needs, and required control — don't self-host to save cash
   you'll repay in operations hours.

## Fix playbook

```text
Bill doubled [COST-01/02]:
 1. Provider cost explorer → group by service → find the delta line.
 2. cost_per_user = monthly_infra / active_users; compare to ARPU.
 3. Fix the driver specifically: right-size the instance / cache the hot path / move cold storage.
Hosting mismatch [COST-03]:
 - Spiky low traffic on a big VPS → move to serverless/managed.
 - Steady heavy compute on premium serverless → move to Railway/VPS; keep the front-end where it is.
```

## Examples

### Example 1: "My cloud bill doubled and I don't know why"
**Output**:
```
[COST-01] Break the bill down by service; find the delta. [COST-02] compute cost-per-user vs
price-per-user. Then fix the specific driver — right-size, cache, or relocate. Never optimize blind.
```

### Example 2: "Should I self-host to save money?"
**Output**:
```
[COST-04] Self-hosting trades invoice for ops hours + reliability risk. Decide on team capacity,
uptime needs, and control required — not sticker price. (Most small teams: managed until ops
capacity genuinely exists.)
```

## Do / Don't

- **Do** trace a bill to a specific service before optimizing; track cost per user.
- **Do** match hosting to stage and revisit as you grow.
- **Don't** pick hosting by hype or self-host purely to shrink the invoice.
- **Don't** treat infrastructure as fixed — it scales with usage.
