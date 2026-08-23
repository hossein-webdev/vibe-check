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
  version: "2.3.0"
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
| COST-05 | Customer ceiling documented: what size customer the current stack can serve, and what leveling up requires | P3 (P2 when chasing enterprise) |
| COST-06 | Unit economics instrumented: cost attributed **per feature**, revenue vs cost **per user**, and a monthly P&L reconciled automatically | P2 once charging |
| COST-07 | Fixed vendor commitments deferred until demand proves them; terms negotiated; every third party behind a swappable boundary | P2 pre-revenue |
| COST-08 | Custom work costed before it is built (build + test surface + maintenance per release + opportunity cost), expressed as configuration where possible, and productized at the third request | P2 if serving multiple clients |

## When to Use This Skill

- User mentions a hosting/cloud bill that's high or jumped.
- User asks "where is my money going?" or about cost per user.
- User is choosing hosting (Vercel vs Railway vs VPS) or sizing infrastructure.
- User is weighing self-hosted vs managed.
- User asks whether the product is profitable, or what a feature costs to run.
- User is paying vendor minimums, or about to commit to one, before having customers.

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

7. **Don't buy production before the market earns it (COST-07).** The expensive version of this is
   months of a vendor's monthly minimum against zero transactions — the infrastructure running while
   the business isn't, meter ticking throughout. Three moves:
   - **Separate what you must *demonstrate* from what you must *operate*.** Build the integration,
     run the flow in the provider's sandbox, and demo the complete experience. Early customers need
     to see that the system works; they rarely need the live production rail on day one. Explaining
     that a capability switches on during onboarding costs far less than months of minimums paid
     while you wait for a first user.
   - **Negotiate — the first offer is not the last.** Ask for a 60-90 day ramp, waived or deferred
     minimums, usage-based pricing, or pilot terms that start when your first customers go live.
     Most providers run startup programs they don't advertise. The downside of asking is a no.
   - **Put every third party behind a boundary you can swap.** One module per vendor, your own
     interface in front of it, so better economics — or a vendor's outage, or their next price
     change — means replacing a rail rather than rebuilding the product. It's the same seam that
     makes `reliability-recovery` REL-03's fallbacks possible; build it once, get both.
   Validate, sell, activate, scale — in that order. Fixed costs come last, not first.

8. **Price the custom work before you agree to it (COST-08).** Eighteen months of saying yes to
   every client request ends with a product that can't ship without regression-testing eleven
   bespoke features first. Every yes felt like retention; collectively they became a roadmap held
   hostage. Three rules keep custom work from eating the product:
   - **Cost it fully, before the first line.** Build time is the small part. Add the expanded test
     surface, the maintenance burden *per release cycle forever*, and the opportunity cost of what
     the team isn't building while it maintains this. If annual maintenance exceeds that client's
     annual contract value, the feature needs different funding or a different scope — and you now
     have the number to say so with. Your best client should not quietly be your most expensive one;
     the per-customer model in COST-06 is where you check.
   - **Configuration over code, always.** A difference expressed as configuration is maintained by
     the system; the same difference expressed as a code branch is maintained by a person, forever.
     This is the economic case for `data-architecture` DATA-10/DATA-11 — the architecture is what
     makes "yes" affordable.
   - **Productize at the third request.** When three clients ask for the same customization it has
     stopped being custom: build it once, build it properly, and ship it to everyone. Track requests
     so you can *see* the third one arrive rather than discovering it after building three variants.

9. **Serverless vs containers is a maturity decision, not a technology one.** Serverless charges a
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
Custom feature requested [COST-08] — before agreeing:
 1. Estimate: build + test-surface growth + maintenance/release + what it displaces. Annualize it.
 2. Compare to that client's ACV. Maintenance > ACV -> re-scope, re-price, or decline with the number.
 3. Can it be config instead of a branch? If yes it is not custom work (-> DATA-10).
 4. Log the request. Third client asking = build it into the product for everyone.
Paying minimums with no customers [COST-07]:
 1. List every vendor with a floor/minimum; for each: needed to OPERATE, or only to DEMO?
 2. Demo-only -> move to sandbox/test keys now; ask the vendor for a ramp, pilot terms, or minimums
    that start at first live customer (startup programs are usually unlisted - ask).
 3. Wrap each vendor in one module behind your own interface so the rail can be swapped later.
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
