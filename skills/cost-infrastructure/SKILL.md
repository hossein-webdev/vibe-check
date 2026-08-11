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
  version: "2.1.0"
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
| COST-06 | Unit economics instrumented: cost attributed **per feature**, revenue vs cost **per user**, and a monthly P&L reconciled automatically | P2 once charging |
| COST-05 | Customer ceiling documented: what size customer the current stack can serve, and what leveling up requires | P3 (P2 when chasing enterprise) |

## When to Use This Skill

- User mentions a hosting/cloud bill that's high or jumped.
- User asks "where is my money going?" or about cost per user.
- User is choosing hosting (Vercel vs Railway vs VPS) or sizing infrastructure.
- User is weighing self-hosted vs managed.
- User asks whether the product is profitable, or what a feature costs to run.

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
5. **Know your customer ceiling (COST-05).** The stack you picked doesn't just set your bill — it
   sets the largest customer you can serve, and most builders never find out where that line is:
   - The **bundled managed stack is the right foundation for your first ~10 customers**. Small
     businesses don't care where the servers live, and those platforms bring SLAs, support, and
     certifications you couldn't earn yourself in two years.
   - **Enterprise isn't the next customer up — it's several evolutions away.** Procurement asks
     where data lives, who owns it, who can access it, whether you can deploy into their VPC, and
     for a SOC 2 attestation (→ `compliance-legal` LEGAL-04/09). Answering that means owning
     infrastructure, security, and support contracts — an organizational build measured in years.
   - **Write the ceiling down now**: what size customer you can serve today, what compliance you can
     meet today, and what would have to change to level up. Builders who know their ceiling close
     deals; builders who pretend they have none lose to questions they can't answer.
6. **Instrument the unit economics (COST-06).** Most builders can quote their tool subscriptions but
   can't say what it costs to serve *one* customer — that gap is the difference between building a
   product and running a business. COST-01 attributes the bill to services; this attributes it to
   the things you actually make decisions about:
   - **Cost per feature, not per month.** Tag consumption — model tokens, function invocations,
     egress, storage — by endpoint, feature, and user action. Some features cost fractions of a cent
     and some cost dollars, and until you measure it you can't tell which. It is routinely the
     feature customers love most that is eating the margin, and that's a pricing decision
     (→ `monetization-pricing` PAY-06), not a reason to remove it.
   - **Revenue per user against cost per user.** Subscription revenue is flat per customer;
     infrastructure cost scales with how hard they use the product. A heavy user who costs more to
     serve than they pay isn't a customer, it's a liability that grows as you succeed — and the fix
     is usually a usage tier or a fair-use limit, not a hope that the average holds.
   - **A monthly P&L that updates itself.** Revenue in, infrastructure out, consumption by user,
     margin by product line — pulled from the payment processor and hosting dashboards on a
     schedule, not typed into a spreadsheet once and abandoned. Usage events from PAY-07 and token
     metering from `llm-cost-control` are the inputs; this is where they add up to a decision.

7. **Serverless vs containers is a maturity decision, not a technology one.** Serverless charges a
   per-unit premium to manage *nothing* — the right deal early, when your time is worth more than
   the premium. Containers cost less per unit but someone must monitor, scale, and deploy them; if
   that someone is also the founder/sales/support, the ops burden costs more in lost focus than the
   premium costs in dollars. **Run the gap analysis**: serverless cost at current usage vs
   equivalent container cost + ops hours per week. The usual production answer is **hybrid** —
   serverless for request/response, containers for background processing, dedicated compute for
   scheduled jobs: split by workload type, not by tutorial (→ `scaling-performance` SCALE-05).

## Fix playbook

```text
Bill doubled [COST-01/02]:
 1. Provider cost explorer → group by service → find the delta line.
 2. cost_per_user = monthly_infra / active_users; compare to ARPU.
 3. Fix the driver specifically: right-size the instance / cache the hot path / move cold storage.
Unit economics from zero [COST-06]:
 1. Tag every metered call (model, function, egress) with feature + user id at the call site.
 2. Weekly rollup: SELECT feature, sum(cost) ... GROUP BY feature ORDER BY 2 DESC — top 3 is your bill.
 3. Per user: cost_per_user vs price_per_user; list anyone above their price. That list is the tier design.
 4. Monthly: pull processor revenue + hosting spend into one sheet on a cron. Margin by product line.
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

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
