---
name: business-logic-abuse
description: >
  Finds the flaws no scanner can see: abuse of features working exactly as built. Covers
  client-supplied prices and quantities, negative and overflow amounts, coupon/referral/free-trial
  farming, quota and plan-limit bypass, race conditions and double-submits on anything that grants
  or spends, out-of-order or self-approved workflows, ownership tricks via delete-and-recreate or
  archive/restore, and export/enumeration abuse. Activates when the user takes payments, runs
  credits or usage limits, offers trials/discounts/referrals, has an approval or multi-step flow, or
  asks why revenue leaks, why balances go negative, or how someone got a paid feature for free.
  Applies to any app handling money, credits, entitlements, or quotas.
user-invokable: true
metadata:
  category: business-logic-abuse
  version: "1.0.0"
---

# Business Logic & Abuse

Every other security area asks whether the code is broken. This one asks whether the **rules** are —
and the code can be flawless while the rules leak money. A scanner cannot help you here: nothing is
malformed, no payload is hostile, no exception is thrown. Someone simply used your product in an
order you didn't picture, at a speed you didn't picture, with a number you didn't picture, and the
system did exactly what it was built to do.

That makes this the one area where **only you can write the test**, because only you know what the
product is supposed to allow. It's also where generated code is weakest: a model builds the path you
described and has no idea what a discount is worth, that a quantity shouldn't be negative, or that
two requests might arrive at once.

Applies to anything with money, credits, entitlements, or quotas. Freedom: **medium** — the checks
are specific, how you enforce them is yours.

## Rules

| ID | Check | If it fails |
|---|---|---|
| BIZ-01 | Money-affecting values (price, currency, discount, entitlement) are read from the server's records, never accepted from the client | P1 |
| BIZ-02 | Numeric inputs bounded and typed: negatives and zero rejected where meaningless, upper bounds set, money in integer minor units or decimal — never floats | P1 if it touches money |
| BIZ-03 | One-time benefits are enforced per identity: coupons, referrals, invites, and free trials survive the new-email-and-try-again test | P2 (P1 if the benefit costs you cash) |
| BIZ-04 | Grant/spend/transfer operations are atomic — conditional update, row lock, or unique constraint — never read-then-write | P1 once concurrent users exist |
| BIZ-05 | Duplicate and replayed submissions can't double-execute | → `api-design` APID-08, `monetization-pricing` PAY-03 |
| BIZ-06 | Quotas and plan limits enforced server-side at the point of consumption, and re-evaluated on downgrade | P2 (P1 if usage costs you money) |
| BIZ-07 | Multi-step flows can't be entered out of order, resumed with stale state, or self-approved | P1 for approval and checkout flows |
| BIZ-08 | Lifecycle edges re-check entitlement: delete-and-recreate, soft-delete, archive/restore, plan change, seat removal | P2 |
| BIZ-09 | Export, search, and bulk endpoints are rate-limited, scoped, and logged — legitimate features are the cheapest exfiltration | P2 (P1 with personal data) |
| BIZ-10 | An abuse pass has actually been run by someone who knows the intended rules, with the cases written down and re-run each release | P2 before taking payments |

## When to Use This Skill

- The app takes payments, sells credits, or has paid tiers.
- There are coupons, referrals, invites, or free trials.
- Balances, quotas, inventory, or seat counts exist.
- There's an approval step, a multi-step checkout, or an onboarding flow with state.
- Revenue doesn't match usage, a balance went negative, or someone has a feature they didn't pay for.
- A scanner and a pen test both came back clean and you still feel uneasy.

## How It Works

### 1. Never trust the client for anything that costs money (BIZ-01)
The generated checkout posts `{item, price, currency}` and the server charges what it was told.
Editing that in the browser takes seconds and leaves no trace in your logs because nothing failed:
- **The client sends identifiers; the server looks up values.** Item id and quantity in, price and
  currency out of *your* records. The same applies to discounts, tax, shipping, tier, and any
  entitlement flag — if the browser can name its own price or its own plan, it will.
- **Recompute the total server-side and compare** before you charge. If the client's total disagrees,
  reject and log it — that mismatch is a signal, not a rounding issue.
- Same rule for anything that spends: credits, seats, tokens. The balance is authoritative on the
  server or it isn't a balance.

### 2. Bound the numbers, and stop using floats for money (BIZ-02)
Generated validation checks that a field is a number, not that it makes sense:
- **Reject negatives and zeros where they're meaningless.** A negative quantity turns a purchase
  into a refund; a negative credit top-up mints balance. Both are one form field away.
- **Set upper bounds too.** Quantity `999999999` is either a mistake or an attack, and it will find
  an integer limit or a memory limit somewhere downstream.
- **Money is integer minor units or a decimal type — never a float.** Floating point makes totals
  that are off by a cent, and repeated rounding in the customer's favour is a slow leak nobody
  reconciles. Currency travels *with* the amount, and cross-currency comparison is a conversion, not
  a numeric comparison.
- Validate at the boundary and again where it's used — the second check catches the path that
  skipped the first.

### 3. One-time means one time (BIZ-03)
Promotions are pure cost when farmed, and the generator implemented the happy path:
- **Enforce against a durable identity**, not the session. A coupon that's one-per-account when
  accounts are free is one-per-email-alias in practice. Bind to payment method, verified identity,
  or something else that costs the abuser more than it costs you.
- **Test the loop yourself**: sign up again with a fresh address, redeem again, refer yourself,
  cancel and re-trial. If it works, it's already being done — this is the most automated abuse on
  the internet.
- **Cap the aggregate as well as the instance.** Per-user limits still allow a thousand users doing
  it once. Alert on redemption-rate spikes (→ `observability` OBS-06); promo farming shows up as a
  metric long before it shows up in support.

### 4. Two requests at the same time (BIZ-04)
The classic generated pattern is read, decide, write — three steps that are not one operation. Two
requests interleave and both pass the check: the last credit spent twice, one seat used by two
people, one inventory unit sold to two buyers. It never reproduces in manual testing because you
click once:
- **Make the decision and the write a single atomic step.** A conditional update
  (`UPDATE … SET balance = balance - :n WHERE id = :id AND balance >= :n`) that affects zero rows
  *is* your rejection. Or take a row lock for the transaction, or let a **unique constraint** be the
  arbiter — the database is much better at this than application code.
- **Never validate in one transaction and act in another.** Between them, the state you checked can
  change (time-of-check to time-of-use), and that gap is the whole exploit.
- **Test it with concurrency, not with clicks.** Fire the same request ten times in parallel and
  assert the invariant afterwards: balance never negative, seats never oversold, one row created.
- Anything queued or retried needs the same guarantee at the consumer
  (→ `scaling-performance` SCALE-05).

### 5. Duplicate submissions (BIZ-05)
A double-click, a retry, a replayed webhook, and a browser back-button are the same event arriving
twice. The remedy is idempotency — a client-supplied key on unsafe operations
(→ `api-design` APID-08) and a processed-event record on the fulfilment side
(→ `monetization-pricing` PAY-03). Named here because the *symptom* shows up as a business problem:
two charges, two shipments, double credits.

### 6. Limits that only exist in the UI (BIZ-06)
The plan says ten projects and the button disables at ten; the API doesn't count:
- **Enforce at the point of consumption, server-side**, in the same operation that consumes
  (BIZ-04 applies — a limit checked non-atomically is a limit that races).
- **Re-evaluate on downgrade.** A user with fifty projects who moves to the ten-project plan is the
  case nobody wrote: decide the rule (block, grandfather, or archive the excess), then implement it
  deliberately rather than discovering it.
- **Metered usage needs a hard ceiling**, not just a counter, whenever consumption costs you money
  (→ `llm-cost-control` LLM-03). "We'll invoice the overage" assumes the account is honest and
  solvent.

### 7. Workflows entered sideways (BIZ-07)
Multi-step flows are a state machine the generator implemented as a sequence of pages:
- **Every step verifies the prior state server-side**, so nobody reaches confirmation by URL with an
  unpaid cart, or completes onboarding while skipping verification.
- **Stale state is rejected, not applied.** An approval issued against a request that changed after
  submission approves something nobody read; carry a version or checksum and re-validate at the
  moment of the decision.
- **Self-approval is blocked explicitly**, including the paths that look different: approving as a
  second account you control, or escalating your own role. The check is "is the approver a different
  principal with authority", not "is the approver an admin".

### 8. The ownership edges (BIZ-08)
Entitlement is usually granted once and never re-derived, so the edges leak:
- **Delete and recreate**: does recreating an object with the same identifier inherit the old one's
  shares, permissions, or paid status?
- **Soft delete**: is deleted data actually excluded from queries, exports, and search — or just
  hidden in the UI (→ `compliance-legal` LEGAL-03)?
- **Archive and restore**: does restoring re-grant access to people who were removed in between?
- **Plan and seat changes**: does removing a seat revoke that person's sessions and tokens now, or
  at next login (→ `auth-access` AUTH-04)?
Each one is a question with a right answer for your product. The failure is never having asked.

### 9. Your own features, used at scale (BIZ-09)
The cheapest way to take all your data is the export button, and the cheapest way to take you down
is your most expensive query:
- **Rate-limit and scope the heavy endpoints** — export, search, report generation, bulk create.
  Scope by tenant and by user; cost is per-request, so the limit belongs there
  (→ `app-security` SEC-13 for the edge, `api-design` APID-06 for the surface).
- **Sequential identifiers make enumeration trivial** — walking `/users/1..n` is not an attack, it's
  pagination (→ `api-design` APID-11).
- **Log and alert on volume**, not just on errors. One account exporting everything at 3am is
  indistinguishable from normal use per-request and obvious in aggregate (→ `observability` OBS-14).

### 10. Actually run the abuse pass (BIZ-10)
Nothing above is found by a tool. Sit down for an hour with the product and the intent:
- **Write the invariants first** — what must always be true. Balance never negative. One redemption
  per customer. Total charged equals total owed. Nobody sees another tenant's row.
- **Then try to break each one**, using only the interface, the way a determined customer would.
- **Keep the cases**; they become a regression suite (→ `test-quality`) and the list you re-run
  before each release (→ `production-readiness` PROD-08). Pen tests and scanners look for broken
  code; this looks for broken rules, and nobody else on the internet can do it for you.

## Fix playbook

```text
Taking payments, never abuse-tested [BIZ-01/02]:
 1. Grep the checkout handler for price/amount/total/currency read from the request body. Each is a bug.
 2. Server looks up price from item id; recompute the total; reject and log any client mismatch.
 3. Reject qty <= 0, set a max, and switch money to integer minor units (or decimal) if it is a float.
Balance or inventory goes wrong under load [BIZ-04]:
 1. Find read-then-write pairs on balances, seats, stock, credits.
 2. Replace with one atomic statement:
    UPDATE accounts SET balance = balance - :n WHERE id = :id AND balance >= :n
    -> 0 rows affected IS the rejection. Or a row lock, or a unique constraint.
 3. Test: 10 parallel requests, then assert the invariant. Repeat in the queue consumer.
Promo farming [BIZ-03]:
 1. Redeem twice with a fresh email. If it works, bind to payment method or verified identity.
 2. Add an aggregate cap and an alert on redemption rate.
Abuse pass [BIZ-10] - one hour, write it down:
 1. List invariants (balance >= 0, one redemption per customer, charged == owed, no cross-tenant reads).
 2. Attack each one through the UI/API only. Log what worked.
 3. Turn every hit into a test; re-run the list each release.
```

## Examples

### Example 1: "Revenue doesn't match the orders and I can't find a bug"
**Output**:
```
[BIZ-01] Check whether the checkout accepts price/currency from the client — if the browser names
the price, that's the leak and nothing in your logs looks wrong. [BIZ-02] Then check for negative
or zero quantities and float money (repeated rounding in the customer's favour reconciles to
exactly this symptom). [BIZ-05] Then duplicates: a retried webhook fulfilling twice.
```

### Example 2: "Someone used one coupon 400 times"
**Output**:
```
[BIZ-03] The limit is per account and accounts are free, so it's per email alias. Bind the benefit
to payment method or verified identity, add an aggregate cap, and alert on redemption rate.
[BIZ-04] Also check redemption is atomic — if it's read-then-write, parallel requests redeem the
same coupon simultaneously regardless of the per-identity rule.
```

## Do / Don't

- **Do** derive every money value from server records; the client sends ids, never amounts.
- **Do** make grant/spend a single atomic operation and test it with parallel requests.
- **Do** write your invariants down and attack them yourself — no scanner will.
- **Don't** treat a clean scan or pen test as coverage here; they look for broken code, not broken rules.
- **Don't** enforce limits in the UI and assume the API agrees.
- **Don't** use floats for money.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
