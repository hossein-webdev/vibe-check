---
name: ai-engineering
description: >
  Makes LLM/AI features reliable and safe in production: validating and retrying model output
  against schemas, measuring quality with model-graded checks in CI, handling non-deterministic
  output in pipelines, giving agents memory (short-term buffer plus vector store), the
  orchestrator-vs-conductor choice for multi-agent systems, and vector store selection (pgvector
  first). For the model bill specifically (caching, routing, spend caps, rate limits), routes to the
  llm-cost-control skill. Activates when the user mentions hallucinations, AI output validation,
  evals, model-as-judge, flaky AI tests, AI agents, agent memory, multi-agent, or vector databases.
  Applies only to apps that call an LLM.
user-invokable: true
metadata:
  category: ai-engineering
  version: "2.0.0"
---

# AI / LLM Engineering

A model-backed feature fails in ways ordinary code doesn't: output isn't deterministic, quality
drifts, and agents forget. Engineer for it — validate everything, measure quality, design memory.

The bill is its own deep-dive → `llm-cost-control` (owns LLM-01..06; a client-side model call is an
automatic P1 there).

Freedom: **medium** — recommended patterns; adapt to the provider/stack.

## Rules

| ID | Check | If it fails |
|---|---|---|
| AI-01 | Cost controls in place | → `llm-cost-control` (LLM-01..06) |
| AI-02 | Every model response validated (schema/length/content) with capped retry-with-feedback | P1 if output reaches users raw |
| AI-03 | Quality measured: model-graded checks in CI, test cases from real failures | P2 |
| AI-04 | CI handles non-determinism (no exact-match assertions on model output) | P2 |
| AI-05 | Agents have designed memory (short-term buffer + long-term vector store) | P3 |
| AI-06 | Multi-agent starts with a single orchestrator (escalate only on measured bottleneck) | P3 |
| AI-07 | Vector store: pgvector evaluated before a dedicated service | P3 |

## When to Use This Skill

- User mentions hallucinations, garbage output, or validating/retrying model responses.
- User mentions evals, model-as-judge, quality regressions, or flaky AI tests in CI.
- User mentions AI agents, agent memory/context, orchestrator/conductor, multi-agent.
- User is choosing a vector store (Pinecone/Weaviate/Chroma/pgvector).
- (Bill, caching, routing, caps → `llm-cost-control`.)

## How It Works

### Reliability (output is not deterministic)
1. **Validate every response (AI-02)** against a schema plus length/content rules; on failure,
   **retry with the error fed back in**, capped at 2–3 attempts, then fall back gracefully. Never
   pipe raw model output to users or into your own systems.
2. **Make quality measurable (AI-03)** — a model-as-grader step in CI, test suites built from real
   user failures, and comparisons across prompt/model versions. Without evals, every prompt tweak is
   a blind deploy.
3. **Fix the CI assumption (AI-04)** — pipelines expect deterministic output; exact-match checks
   flake on model responses. Assert semantically (grader, contains/shape checks, tolerances).

### Agents & memory
4. **Design memory (AI-05)** — agents forget between calls; pair a short-term conversation buffer
   with a long-term vector store for durable context.
5. **Start simple with multi-agent (AI-06)** — one orchestrator coordinating workers is the right
   default; adopt a more elaborate topology only when measurements show the orchestrator is the
   bottleneck.
6. **Don't over-buy vectors (AI-07)** — Postgres `pgvector` covers most workloads before
   Pinecone/Weaviate/Chroma earn their complexity.

## Fix playbook

```text
Garbage output reaching users [AI-02]:
 1. Define the output schema (zod/pydantic); validate every response.
 2. On failure: retry with the validation error in the prompt (max 2-3), then fallback UX.
Flaky AI tests [AI-04]:
 1. Replace exact-match asserts with shape/contains checks or a grader model.
 2. Pin model + temperature in CI where the provider allows.
No evals [AI-03]:
 1. Collect 10-20 real failure cases → they are your first eval suite.
 2. Add a model-as-judge CI step; block merges on regressions.
```

## Examples

### Example 1: "The AI sometimes returns garbage that breaks the UI"
**Output**:
```
[AI-02] Wrap the call: schema-validate → on failure retry with the error as feedback (cap 3) →
fallback UI. [AI-03] Turn those failures into a CI eval so regressions get caught pre-merge.
```

### Example 2: "Should I use Pinecone for my RAG feature?"
**Output**:
```
[AI-07] Start with pgvector in the Postgres you already run — one system, real joins, no new bill.
Move to a dedicated store only when scale/latency measurements say so.
```

## Do / Don't

- **Do** validate + retry every model response; build evals from real failures.
- **Do** start multi-agent with one orchestrator; add memory deliberately.
- **Don't** exact-match model output in CI.
- **Don't** ship raw model output to users — or a model call in client code (→ llm-cost-control).

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
