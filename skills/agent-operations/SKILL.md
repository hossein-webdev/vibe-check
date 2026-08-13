---
name: agent-operations
description: >
  Runs AI agents safely and coherently once they do real work: designing memory, choosing a
  multi-agent topology, keeping long multi-step runs from drifting, budgeting the tool surface an
  agent evaluates on every request, treating instruction files and connectors as perishable
  configuration, and enforcing agent boundaries with scoped credentials, egress control, and an
  append-only tool-call audit log. Activates when the user mentions AI agents, agent memory or
  context, an agent losing track of a long task, multi-agent or orchestrator design, MCP servers,
  tool definitions or too many connected tools, agent instruction/skill/config files going stale,
  agent guardrails, human-in-the-loop review, or an agent taking an action it shouldn't have.
  Applies to any app where a model calls tools or runs multi-step work.
user-invokable: true
metadata:
  category: ai-engineering
  role: sub-skill
---

# Agent Operations

A model that answers a question and a model that *acts* are different engineering problems. The
second one accumulates state, chooses tools, runs unattended for long stretches, and can reach
things that matter. Three failure modes dominate, and none of them look like a bad model:

- **Drift** — coherent at step 1, contradicting itself by step 15, project forgotten by step 30.
- **Clutter** — a context window filled with tools and instructions that have nothing to do with the
  task, competing for the attention the work needs.
- **Reach** — an agent doing something destructive that a human waved through, because a human
  without tooling isn't a control.

Owns the agent half of the `AI-` namespace (AI-05, AI-06, AI-08..11); output validation, evals, and
vector-store choice stay in `ai-engineering`, and the model bill is `llm-cost-control`.

Freedom: **medium** — the boundaries are prescriptive, the topology is yours.

## Rules

| ID | Check | If it fails |
|---|---|---|
| AI-05 | Memory designed deliberately: short-term buffer + long-term store, not hope | P3 |
| AI-06 | Multi-agent starts with a single orchestrator; elaborate topologies only on measured bottlenecks | P3 |
| AI-08 | Long runs are chunked, state-carrying, and checkpointed — not one 30-step conversation | P2 if agents run multi-step work unattended |
| AI-09 | Tool surface budgeted: the agent isn't carrying connectors it won't use on this task | P3 (P2 when runs degrade or costs climb) |
| AI-10 | Agent configuration treated as perishable — instruction files, skills, and connectors reviewed on a cadence | P3 |
| AI-11 | Agent boundaries enforced in the tooling (scoped credentials, egress control, deny-by-default gates) with an append-only tool-call log | P1 once an agent can reach production data or spend money |

## When to Use This Skill

- The user is building or debugging an AI agent, or a multi-agent system.
- An agent contradicts itself, forgets the task, or degrades over a long run.
- The user mentions MCP servers, tool definitions, or a long list of connected tools.
- Output got worse over months without the model changing.
- The user mentions guardrails, human-in-the-loop review, or an agent doing something it shouldn't.
- (Output validation, evals, vector stores → `ai-engineering`; the bill → `llm-cost-control`.)

## How It Works

### 1. Memory is a design, not a side effect (AI-05)
Agents forget between calls. Pair a **short-term conversation buffer** with a **long-term store**
(vector or plain records) so durable facts survive the window, and be explicit about which is which:
what must persist across sessions, what may be summarized, what should be dropped. The written state
file in AI-08 is the durable half made concrete.

### 2. Start with one orchestrator (AI-06)
One orchestrator coordinating workers is the right default. Elaborate topologies — negotiating
peers, hierarchies of conductors — buy coordination overhead you pay on every request. Move only
when measurement shows the orchestrator itself is the bottleneck, not because the diagram looks
better.

### 3. Architect long runs, don't just launch them (AI-08)
An agent that is sharp at step 1 and incoherent by step 30 is not malfunctioning — it ran out of
context. How you feed the work matters more than which model you picked:
- **A state document travels with the task.** A running project-state file updated after every step:
  what's complete, what's in progress, the constraints, the decisions made and why. Each new step
  reads it first. That file *is* the memory the model doesn't have natively.
- **Decompose before executing.** Never run a 30-step job as one conversation. Split it into chunks
  of five to seven steps, each a fresh session seeded with the state file. Short scopes keep the
  agent from drifting far enough to contradict itself.
- **Checkpoint between chunks.** The agent stops and presents a summary for review before
  continuing. Make it a real gate — does the state file match reality, do the artifacts exist, does
  the next chunk still make sense — not a rubber stamp.

### 4. Budget the tool surface (AI-09)
Every tool you connect is evaluated on **every** request, whether or not it's relevant. Ten
permanently-loaded connectors mean ten tools considered before the agent starts thinking about the
actual task — they aren't idle, they're competing for a finite context window, and they add a
failure mode where the agent picks a plausible wrong tool.
- **Load per task, not per project.** Attach what this job needs; leave the rest off. A curated
  three beats an available thirty.
- **Prefer direct integration when the model can do it.** Current models can read API docs,
  authenticate, construct requests, and handle responses without a pre-built wrapper. When the
  integration is a couple of HTTP calls, having the agent build it for the task is often lighter
  than carrying a permanent connector for it.
- **Keep the wrapper where it earns its place** — a fiddly auth dance, a stateful protocol, a
  hand-tuned tool description that measurably improves selection, or a boundary you want enforced in
  one reviewed place rather than reconstructed ad hoc. This is a budget, not a purge.
- **Notice the symptom.** Degrading quality as a project accumulates integrations is usually tool
  clutter, not a worse model. Cut the surface and re-measure before changing anything else.

### 5. Configuration is perishable (AI-10)
Instruction files, skill definitions, prompt scaffolding, and connectors are all still running
months after you wrote them, and the agent consults them every time:
- **Stale instructions compete with current ones.** The agent is following what you said six months
  ago *and* what you're saying now; where they conflict the output degrades. It reads as the model
  getting worse when it's really contradictions being fed in.
- **Scaffolding written for a weaker model becomes a brake.** Workarounds for limitations that no
  longer exist are training wheels bolted to something that outgrew them.
- **Put it on a cadence.** Review the whole stack on a fixed schedule — a quarter is a reasonable
  default — and strip anything you can't justify against the *current* model. Rebuilding clean is
  usually faster than auditing line by line.
- **Date your config.** A comment recording when a file was written and what it was working around
  makes the next review a decision instead of an excavation.

### 6. Boundaries live in the tooling, not in the reviewer (AI-11)
The most expensive agent failures share a shape: the agent did something destructive and a human
approved it. A reviewer facing hundreds of outputs a day cannot catch every dangerous action by
reading — that isn't a guardrail, it's a bottleneck without teeth. The skill is choosing what the
agent can reach at all:
- **Scoped credentials.** Per-agent, least-privilege, short-lived. An agent that never holds a
  production write credential cannot use one, whatever it decides to do (→ `auth-access` AUTH-09).
- **Network egress control.** An allowlist of destinations. Exfiltration and surprise third-party
  calls both stop at a boundary the agent doesn't control.
- **Deny-by-default gates on dangerous operations** — schema changes, deletes, payments, production
  writes, credential access. Out-of-boundary operations are rejected automatically; the human is
  asked only about the narrow set that genuinely needs judgment, which is the only volume a human
  can actually review.
- **An append-only tool-call log.** What was accessed, what changed, what was called, when, and
  under whose credential. Without it you cannot answer what the agent did while you weren't
  watching, and the difference between a diagnosis and a guess is that log (→ `observability`
  OBS-14).
- **A structured audit each way** — a repeatable check on what the agent is allowed to do before a
  run and what it actually did after, rather than a personal read-through whose quality depends on
  the hour. Prompt-injection surface belongs in the same review (→ `app-security` SEC-10).

## Fix playbook

```text
Agent drifts on long jobs [AI-08]:
 1. Create PROJECT_STATE.md: done / in-progress / constraints / decisions+why. Update every step.
 2. Split into 5-7 step chunks; each chunk a fresh session seeded with that file.
 3. Between chunks: agent summarizes, you verify artifacts exist and state matches reality.
 4. If a chunk needs more than ~7 steps, it's two chunks.
Quality degraded as the project grew [AI-09/AI-10]:
 1. List every connected tool and every instruction/skill file the agent loads.
 2. For each: used on this task? justified against the CURRENT model? If no to either, unload it.
 3. Re-run a known-good task and compare. Cut surface first; change models last.
 4. Put the next review on the calendar (~90 days) so it doesn't accumulate again.
Agent can reach production [AI-11]:
 1. Issue a dedicated short-lived credential, least privilege. Never the shared service role.
 2. Egress allowlist; deny by default.
 3. Gate list: DROP/ALTER/DELETE, payments, credential reads, prod writes -> auto-reject or explicit approval.
 4. Log every tool call append-only (actor, action, target, timestamp) and alert on gate hits.
```

## Examples

### Example 1: "My agent was great last month and it's worse now"
**Output**:
```
[AI-10] The model didn't regress — your configuration aged. Every instruction file and skill you
loaded is still being consulted, including the ones written around limitations that no longer
exist, and where old and new conflict the output degrades. [AI-09] Same for tools: everything
connected is evaluated on every request. List both surfaces, unload what this work doesn't need,
re-run a known task, and put the next review on the calendar.
```

### Example 2: "I review every action before it runs, so we're safe"
**Output**:
```
[AI-11] Review is a bottleneck, not a control — nobody catches every dangerous action by reading
hundreds a day. Put the boundary in the tooling: scoped short-lived credentials, an egress
allowlist, deny-by-default gates on destructive operations, and an append-only tool-call log. Then
the approvals you *do* see are the few that genuinely need judgment.
```

## Do / Don't

- **Do** design memory and start multi-agent with a single orchestrator.
- **Do** chunk long runs with a carried state file and a real checkpoint between chunks.
- **Do** budget the tool surface — load what the task needs, not everything available.
- **Do** enforce limits in credentials, egress, and gates; log every tool call append-only.
- **Don't** let instruction files and connectors accumulate unreviewed — they go stale and conflict.
- **Don't** treat human approval as a guardrail on its own; without tooling it approves what it can't catch.
- **Don't** blame the model for degradation before you've cut the surface and re-measured.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
