---
name: llm-cost-control
description: >
  Stops the model bill from killing an AI feature. Covers the unbudgeted "prompt bill" (cents per
  call becoming thousands per month), semantic caching, routing requests to the right-sized model,
  per-user spend caps, rate limiting, locking down public AI endpoints against bot-driven bills, and
  stacking the provider's built-in budget levers. Activates when the user mentions an AI/LLM/API
  bill, token costs, OpenAI/Anthropic/Gemini spend, a bill that jumped, caching AI calls, model
  routing, spend caps, or rate limiting an AI endpoint. Child of ai-engineering; applies to any app
  calling a paid model API.
user-invokable: true
metadata:
  category: ai-engineering
  parent: ai-engineering
  version: "2.0.0"
---

# LLM Cost Control

Nobody budgets the prompt bill: $0.02 a call feels free until 1,000 users make it **$14k/month** —
the silent killer of AI products. Unlike servers, model spend scales per request with no natural
ceiling, and a public AI endpoint lets strangers spend your money. Control it before launch, not
after the invoice.

Freedom: **medium** — apply the levers in order; adapt to the provider.

## Rules

| ID | Check | If it fails |
|---|---|---|
| LLM-01 | Semantic cache in front of repeatable calls | P2 |
| LLM-02 | Requests routed by difficulty to right-sized models (not one big model for all) | P2 |
| LLM-03 | Per-user spend caps exist | P1 when public / P2 internal |
| LLM-04 | AI endpoints rate-limited and behind auth + input validation | P1 when public |
| LLM-05 | Provider budget levers (budgets, alerts, caps) configured and stacked | P3 |
| LLM-06 | No model call (or key) in client-side code | P1 always |

## When to Use This Skill

- User mentions the AI/model/API bill, token spend, or a bill that jumped.
- User is adding a paid-model feature and asks what it will cost at scale.
- User mentions caching AI calls, model routing, spend caps, or rate limiting.
- A scan/audit found a public AI endpoint or a client-side model call.

## How It Works (levers, in impact order)

1. **Semantic caching (LLM-01).** Cache by *meaning*, not exact string — most prompts repeat in
   substance. Returning a stored answer instead of paying again is usually the single biggest cut.
2. **Model routing (LLM-02).** Classify request difficulty; send easy ones to a small cheap model,
   reserve the frontier model for the hard ones. One-model-for-everything is the priciest default.
3. **Per-user spend caps (LLM-03).** Track cost per user; cut off or degrade gracefully at a cap.
   Without caps, one abusive or buggy client sets your bill.
4. **Rate limiting + endpoint lockdown (LLM-04).** A publicly reachable AI endpoint plus bot traffic
   is an unbounded invoice. Gateway → auth → input validation (length/shape) → rate limit. Client
   calls the endpoint; only the server holds the provider key (LLM-06 — a client-side call is an
   automatic P1: the key *and* the bill are public).
5. **Stack the provider levers (LLM-05).** Budgets, alerts, hard caps exist in every major
   provider's console — most builders never combine them. Set monthly budget + alert threshold +
   per-key limits so the platform backstops your code.
6. **Meter from day one.** Log tokens + cost per call (many SDKs expose it) tagged by user/feature —
   you can't cap or price what you don't measure (feeds `monetization-pricing` usage tracking).

## Fix playbook

```text
Bill exploded this month:
 1. Pull per-endpoint/per-user cost from logs (add cost logging first if missing).
 2. Add semantic cache on the top repeating call — measure hit rate.
 3. Route by difficulty (cheap model default, escalate on need).
 4. Cap per-user spend; rate-limit the endpoint; set provider budget + alerts.
Client-side model call found (LLM-06):
 1. Move the call to a server route; put the key in server env only.
 2. Rotate the exposed key (→ secrets-management); add auth + rate limit on the new route.
```

## Examples

### Example 1: "My GPT feature bill went $50 → $4,000"
**Output**:
```
[LLM-01] Add semantic caching first — repeated prompts stop paying twice (biggest drop).
[LLM-02] Route by difficulty: small model default, frontier only when needed.
[LLM-03/04] Per-user caps + rate limit the endpoint — stop bot/buggy-client spend.
[LLM-05] Set provider budget + alerts as the backstop. Verify: cost/user dashboard trends down.
```

### Example 2: "Is my AI endpoint safe to expose for the demo?"
**Output**:
```
Only behind: auth → input validation → rate limit → per-user cap [LLM-04/03].
Never call the model from the browser [LLM-06] — that publishes your key and your wallet.
```

## Do / Don't

- **Do** cache by meaning, route by difficulty, cap per user — before launch.
- **Do** meter token cost per user/feature from day one.
- **Don't** leave an AI endpoint public and uncapped.
- **Don't** ever ship a provider key or model call in client code.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
