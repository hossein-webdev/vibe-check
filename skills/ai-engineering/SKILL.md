---
name: ai-engineering
description: >
  Makes LLM/AI features cheap, reliable, and safe in production. Covers keeping the model bill under
  control (semantic caching, routing requests to the right-sized model, per-user spend caps, rate
  limiting), validating and retrying model output, measuring quality with model-graded checks in CI,
  giving agents memory (short-term plus a vector store), the orchestrator-vs-conductor choice for
  multi-agent, and vector store choice (pgvector first). Activates when the user mentions LLM/AI cost,
  the model/API bill, model routing, caching AI calls, hallucinations or output validation, evals, AI
  agents, agent memory, or vector databases. Applies only to apps that call an LLM.
user-invokable: true
metadata:
  category: ai-engineering
---

# AI / LLM Engineering

A model-backed feature fails in ways ordinary code doesn't: the cost is unbounded, the output isn't
deterministic, and an exposed endpoint can be run up by anyone. Most teams never budget for the bill —
a couple of cents per call turns into a serious monthly number once real traffic arrives. Engineer for
all three.

Skip if the app doesn't call an LLM. Otherwise, freedom: **medium** — adapt to your provider.

## When to Use This Skill

- User mentions an AI feature and its cost, the model bill, token spend, or a surprise API charge.
- User mentions model routing, semantic/prompt caching, spend caps, or rate-limiting AI calls.
- User mentions hallucinations, validating/retrying model output, schemas, or model-graded evals.
- User mentions AI agents, agent memory/context, orchestrator/conductor, or multi-agent setups.
- User is choosing a vector store (Pinecone/Weaviate/Chroma/pgvector).

## How It Works

### Cost control (before launch)
1. **Cache by meaning.** Most prompts repeat in substance — a semantic cache returns a stored answer
   instead of paying for the call again. Usually the biggest single saving.
2. **Route to the right-sized model.** Send simple requests to a small, cheap model and reserve the
   large one for hard ones. One model for everything is the most expensive default.
3. **Cap and limit.** Set **per-user spend caps** and **rate limits** on AI and other expensive
   endpoints; an open AI endpoint plus bot traffic produces a large bill fast. Stack whatever budget
   controls the provider already offers.
4. **Lock the endpoint down** — gateway, input validation, per-user caps (overlaps `app-security`).

### Reliability (output isn't deterministic)
5. **Validate every response** against a schema and your content rules; on failure, **retry with the
   error fed back in**, capped at a couple of attempts. Never pipe raw output straight to users.
6. **Make quality measurable** — score outputs with a model-as-grader step in CI, build test cases from
   real failures, and compare results across prompt/model versions.
7. **Don't let CI assume determinism** — exact-match checks flake on model output; compare semantically
   or with tolerances (overlaps `deployment-cicd`).

### Agents & memory
8. **Give agents memory** — they forget between calls; pair a short-term conversation buffer with a
   long-term vector store.
9. **Start simple with multi-agent** — a single orchestrator coordinating workers is the right default;
   only add a more elaborate structure once you can show the orchestrator is the bottleneck.
10. **Don't over-buy a vector store** — Postgres with `pgvector` handles most cases before you need a
    dedicated service.

## Examples

### Example 1: "I added a model feature and the bill exploded"
**Action**: Apply the cost levers in order.
**Output**:
```
1. Semantic caching — repeated prompts stop paying twice (usually the biggest drop).
2. Route by difficulty: cheap model for easy calls, big model only when needed.
3. Per-user spend caps + rate-limit the endpoint to stop bot-driven charges.
```

### Example 2: "The model sometimes returns garbage that breaks the UI"
**Action**: Validate, retry, and add a grader.
**Output**:
```
Wrap the call: validate against a schema → on failure, retry with the error as feedback (cap ~2–3).
Add a model-graded check in CI built from your real failures so regressions get caught before merge.
```

## Do / Don't

- **Do** cache by meaning, route by difficulty, and cap per-user spend before launch.
- **Do** validate and retry output; never ship raw model text to users.
- **Don't** leave an AI endpoint open and uncapped.
- **Don't** buy a dedicated vector store before trying pgvector.
