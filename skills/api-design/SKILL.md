---
name: api-design
description: >
  Designs the API surface itself so it's consistent, predictable, and safe to consume: resource
  naming, HTTP method and status-code semantics (including never returning 200 for failures), a
  standard error shape, pagination (cursor vs offset), filtering and sorting conventions, rate-limit
  headers, versioning with a deprecation policy, idempotency keys for retried operations, and
  request-id echoing. Activates when the user is designing or reviewing API endpoints, mentions REST
  conventions, resource naming, status codes, pagination, filtering, error responses, API
  versioning/deprecation, request signing or HMAC verification, mass assignment or which fields a
  write accepts, idempotency, GraphQL introspection or query-depth limits, or building a public/partner
  API. Applies to any app that
  exposes an API. (For where the API sits — the backend boundary — use api-architecture.)
user-invokable: true
metadata:
  category: api-architecture
  parent: api-architecture
  version: "2.13.0"
---

# API Design

`api-architecture` decides **where** the API sits (the boundary between client and data). This skill
decides **what the surface looks like** — and generated endpoints are reliably sloppy here: verbs in
URLs, `200` for everything, ad-hoc error shapes, no pagination until the first slow query. A
consistent surface is cheaper to consume, debug, and evolve.

Freedom: **medium** — conventions with room for house style; the status-code and idempotency rules
are not optional.

## Rules

| ID | Check | If it fails |
|---|---|---|
| APID-01 | Resources are plural nouns, kebab-case, no verbs in URLs | P3 |
| APID-02 | Methods and status codes used semantically — never `200` for errors or failures | P2 (P1 on payment webhooks → PAY-04) |
| APID-03 | One standard error shape: machine `code` + human `message` + field details; no internal leaks | P2 |
| APID-04 | Every list endpoint paginated (cursor-based where scale matters) | P2 |
| APID-05 | Filtering/sorting follow one convention across endpoints | P3 |
| APID-06 | Rate-limit surface: `X-RateLimit-*` headers, `429` + `Retry-After` | P3 |
| APID-07 | Versioned path (`/v1`) + deprecation policy (max 2 live versions, sunset dates) | P2 once consumed externally |
| APID-08 | Unsafe operations accept an idempotency key (retries can't double-execute) | P2 (P1 for payments) |
| APID-09 | Request id accepted/echoed (`X-Request-Id`) for tracing and support | P3 |
| APID-10 | API is machine-consumable: structured, self-describing, ideally MCP-exposed for AI-assistant integration | P3 (P2 for platform/API products) |
| APID-11 | Responses minimized: no internal/sequential IDs, no fields the client doesn't need | P1 if PII leaks / P2 otherwise |
| APID-12 | Mutating requests carry a verifiable signature (HMAC over body + timestamp + nonce) where the caller is a server or partner, not a browser session | P2 for partner/server-to-server APIs (P1 if the call moves money or grants access) |
| APID-13 | Writes accept an explicit field allowlist, never the request body spread onto a record — and privilege, ownership and billing fields are never client-writable | P1 |
| APID-14 | A GraphQL endpoint is bounded: introspection off in production, query depth/complexity capped, batching limited, and per-field authorization — the single endpoint does not make the surface single | P1 if GraphQL is exposed publicly |

## When to Use This Skill

- Designing new endpoints or reviewing an AI-generated API surface.
- User mentions REST conventions, resource naming, status codes, or error formats.
- User adds pagination, filtering, sorting, or search to list endpoints.
- User plans versioning/deprecation, a public or partner API, or webhook contracts.
- Consumers report confusing responses ("it returns 200 with an error inside").

## How It Works

### 1. Resources & methods (APID-01, APID-02)
- URLs name **things, not actions**: `GET /v1/users/:id/orders` — plural, kebab-case, nesting for
  ownership. Verbs only for true non-CRUD actions (`POST /v1/orders/:id/cancel`).
- Method semantics: GET reads (safe), POST creates/acts, PUT replaces, PATCH edits, DELETE removes.
  GET/PUT/DELETE are idempotent by contract — keep them that way.

### 2. Status codes — the contract inside the contract (APID-02)
`200` + `{"success": false}` is the generated-code signature and it breaks every consumer,
retry system, and monitor downstream:
- **2xx** only for actual success: `201` + `Location` for creates, `204` for empty success.
- **4xx** the caller's problem: `400` malformed, `401` unauthenticated, `403` unauthorized,
  `404` missing, `409` conflict, `422` valid-JSON-bad-data, `429` rate-limited.
- **5xx** your problem — never leak stack traces or SQL.
- **Webhooks live by this rule**: acknowledging a failed charge with `200` tells the provider
  "delivered, don't retry" — silent revenue loss (see `monetization-pricing` PAY-04).

### 3. One error shape everywhere (APID-03)
```json
{ "error": { "code": "validation_error", "message": "Request validation failed",
             "details": [ { "field": "email", "code": "invalid_format", "message": "Not a valid email" } ] } }
```
Machine-readable `code`, human `message`, per-field details for validation. Same shape on every
endpoint — consumers write one error handler, not one per route.

### 4. Pagination, filtering, sorting (APID-04, APID-05)
- **Every list endpoint ships paginated** — the unpaginated list works in the demo and times out at
  100k rows (see `scaling-performance`).
- **Offset** (`?page=2&per_page=20`) for small/admin datasets and page-number UX; **cursor**
  (`?cursor=…&limit=20`, return `has_next` + `next_cursor`) for feeds, infinite scroll, and public
  APIs — stable under concurrent writes, constant-time at any depth.
- Pick one filtering/sorting grammar and reuse it: `?status=active`, ranges `?price[gte]=10`,
  multi-value `?category=a,b`, sort `?sort=-created_at,price`.

### 5. The operational surface (APID-06, APID-08, APID-09)
- **Rate limits are visible**: `X-RateLimit-Limit/Remaining/Reset` on responses; `429` with
  `Retry-After` when exceeded. (The limiting *architecture* — hard/adaptive/tiered — is
  `api-architecture` API-06.)
- **Idempotency keys** on unsafe operations that get retried (checkout, job triggers): client sends
  `Idempotency-Key`, server stores result per key — a network retry can't double-charge.
- **Request ids**: accept a sane `X-Request-Id` or mint one, echo it in the response — support
  tickets and logs join on it (see `observability` OBS-04).

### 6. Versioning & deprecation (APID-07)
- Path versioning (`/api/v1/…`) — explicit, routable, cacheable. Start at `v1`, bump **only for
  breaking changes** (remove/rename/retype fields, URL or auth changes). Additive changes don't
  version.
- Keep **at most two live versions**; deprecate with notice + a `Sunset` header, then `410 Gone`.
- **Instrument the deprecation, don't just announce it.** Count calls to the retiring version per
  consumer, so removal is a decision backed by a number rather than a hopeful date: chase the two
  consumers still on `v1` instead of emailing everybody, and drop the endpoint when its usage
  reaches zero. A sunset date with no usage telemetry is how you either break a paying integration
  or keep a dead endpoint alive for years.
- Publish the contract + a changelog per change (`api-architecture` API-03/05).

### 6b. Prove the request came from who it claims (APID-12)
Session auth answers "is this a logged-in user"; it does not answer "did this exact payload come
from a client I trust, unmodified". For server-to-server and partner traffic — where there's no
browser, no cookie, and no user to challenge — an endpoint that accepts a well-formed body and
returns `200` is a front door with no lock:
- **Sign the mutating calls.** Every `POST`/`PUT`/`PATCH`/`DELETE` carries an HMAC over the raw body
  computed with a shared secret; the server recomputes and rejects on mismatch, before any handler
  runs. Verify against the **raw bytes** — re-serializing the parsed JSON first is the classic bug
  that makes the check pass for tampered payloads.
- **Put a timestamp and a nonce in the signed material**, and reject anything outside a small clock
  window or a nonce you've already seen. A signature alone is replayable forever; this is the same
  idea as APID-08's idempotency key, doing a security job rather than a correctness one.
- **Compare in constant time**, keep the secret server-side only, and give each consumer their own
  key so one leak revokes one integration.
- You're on the other side of this contract too: when you *receive* provider webhooks, verifying
  their signature is the same control (→ `monetization-pricing` PAY-02).

### 7. Return only what the client needs (APID-11)
Every endpoint is a door, and the generated default leaves it wide open — returning every field,
every internal ID, every relationship. An attacker doesn't hack the database; they call the API and
read the response:
- **Sequential/internal IDs enable enumeration** — increment the number, walk every user. Expose
  opaque identifiers (UUIDs), never raw database keys.
- **Strip everything the client doesn't render** — a user endpoint returning email + phone +
  billing address to any caller is a breach that required one request and JSON literacy. Explicit
  response shapes (DTOs/serializers), never `SELECT *` piped to JSON.
- **Your API is a first impression** — technical buyers evaluating an integration judge it before
  any sales call. Unfiltered responses and sequential IDs read as immaturity, and they don't tell
  you; they pick the competitor whose API looks intentional.

### 8. Design for machine consumers (APID-10)
The newest consumer of your API isn't a developer reading docs — it's an **AI assistant told to
"integrate with this service."** MCP (Model Context Protocol) adoption has crossed tens of millions
of monthly SDK downloads with thousands of indexed servers; assistants integrate with an
MCP-speaking service in minutes and route around ones that need an integration team.
- Return **structured, self-describing data** — an API that dumps raw JSON and expects the client
  to figure it out is invisible to machine consumers.
- Publish a machine-readable contract (OpenAPI at minimum; an **MCP server** for first-class
  assistant integration) so tools can discover capabilities without human reading.
- Treat discoverability as a distribution channel: the builder who never reads documentation still
  picks the product their assistant could wire up in five minutes.

**And the same shift is reaching your product pages, not just your API.** Agents now compare
products, read pricing, and complete purchases with no human ever visiting the site. A human reads
copy and decides emotionally; an agent reads **structured data** and decides logically:
- **Publish machine-readable product data** — schema markup, clean pricing tables, parseable specs.
  A beautiful page with no structured data underneath is invisible to an agent.
- **Expose the criteria agents filter on** that you never thought to publish — uptime guarantees,
  integration lists, security certifications, data-export capability. Missing information gets
  assumed or gets you skipped.
- **Check how you're actually described**: ask the major assistants to recommend a product in your
  category. If you don't appear, you don't exist to that channel.

**If you sell to builders, the agent isn't browsing — it's installing.** For developer tools,
wrappers, and integrations the transaction happens inside the development environment: the agent
queries for a capability, reads your documentation, checks the pricing, and wires you in. No landing
page, no demo call, no checkout. Three things that decide whether that path completes:
- **Docs are the sales surface.** A stable URL, machine-readable capability and error contracts, and
  a copy-pasteable first call. Anything gated behind "contact us" is a dead end to an agent.
- **Self-serve credentials.** If getting a key requires a human, the integration stops there.
- **Metered pricing an agent can transact** — tokens per action, credits per query, value per
  outcome. A per-seat monthly plan is unbuyable by a consumer that shows up for one call
  (→ `monetization-pricing` PAY-13).

### 9. Accept the fields you meant to accept (APID-13)
APID-11 keeps extra fields out of the **response**. This is the same discipline on the way in, and it's
the one with a privilege-escalation ending. The generated handler takes the body and hands it to the
ORM {EM} `update(id, req.body)`, `Model(**payload)`, `{ ...user, ...req.body }` {EM} because that's the
shortest correct-looking code, and it means the client decides which columns get written:
- **Allowlist the writable fields per endpoint**, explicitly. A schema that validates the fields you
  expect but passes the whole object through is not an allowlist; the validated object must be *built*
  from named fields, or your validator must be configured to strip what it didn't declare. The
  profile-update endpoint takes `name` and `avatar_url`; it does not take `role`, however carefully it
  checks the name.
- **Name the fields that must never be client-writable** and keep them out of every write path: `role`,
  `is_admin`, `permissions`, `plan`, `credits`, `balance`, `verified`, `owner_id`, `tenant_id`,
  `created_at`, and anything your billing reads ({ARR} `business-logic-abuse` BIZ-01 for the money
  consequence). Setting these is an operation with its own endpoint and its own authorization, not a
  field on a general update.
- **Nested objects and arrays are the same hole one level down.** A `PATCH` carrying
  `{ profile: { ... }, subscription: { plan: "enterprise" } }` needs the allowlist applied at every
  level you accept, not only the top.
- **Automated review will pass this**, because nothing is malformed and no rule is violated {EM} the code
  does exactly what it says. That's why it's a checklist item rather than something you expect a tool to
  catch ({ARR} `production-readiness` PROD-09).
- **Test it directly**: as an ordinary user, send `role: "admin"` (and `plan`, and `owner_id`) to every
  write endpoint you have, then read the record back. Nothing should have changed.

### 10. If the endpoint is GraphQL (APID-14)
Everything above is shaped for REST, because most generated APIs are. GraphQL moves the same obligations
to different places, and a generator scaffolds the schema and resolvers while leaving every limit at its
permissive default:
- **Turn introspection off in production.** It is a complete, machine-readable map of every query,
  mutation, type and relationship you expose {EM} useful in development, and a reconnaissance gift in
  production. Disable it on the public deployment and keep it in your local and staging environments. Then
  assume it leaked anyway and don't treat obscurity as a control.
- **Cap depth and complexity.** A single valid query can nest relationships until it asks the database for
  the product of several tables; one request becomes a denial of service with no volume at all. Set a
  maximum depth, assign complexity costs to fields, and reject past a ceiling {EM} this is the GraphQL
  shape of APID-04's pagination requirement and of `api-architecture` API-06's rate limits, both of which
  count requests and so miss it entirely.
- **Limit batching and aliasing.** Array-batched operations and repeated aliases multiply work inside one
  request, which is also how a rate-limited login mutation gets brute-forced: a thousand attempts, one
  HTTP request, one counter increment.
- **Authorize per field and per resolver**, not at the endpoint. One URL serves everything, so there is no
  route to protect {EM} every resolver that returns data someone shouldn't see needs its own check, which is
  `auth-access` AUTH-06 applied resolver by resolver. Nested resolvers are the ones that get missed.
- **Errors shouldn't narrate the schema.** Default handlers return "did you mean" suggestions and type
  details that rebuild the map introspection would have given away ({ARR} `app-security` SEC-11).
- **The rest still applies**: idempotency on mutations (APID-08), field allowlisting on inputs (APID-13),
  minimised payloads (APID-11), and request ids (APID-09).

## Fix playbook

```text
"Returns 200 with an error inside" [APID-02/03]:
 1. Map every handler's failure paths to real status codes (400/401/403/404/409/422/429/5xx).
 2. Standardize the error envelope ({error:{code,message,details}}); one middleware, not per-route.
 3. Webhooks: failure → non-2xx (provider retries) or DLQ before acking (→ PAY-04/OBS-08).
Unpaginated list endpoint [APID-04]:
 1. Add cursor pagination: WHERE id > :cursor ORDER BY id LIMIT :n+1 (the +1 row = has_next).
 2. Cap limit (e.g. 100); return next_cursor; document it in the contract.
Duplicate charges on retry [APID-08]:
 1. Accept Idempotency-Key; UNIQUE-constrain it; store + replay the first response for repeats.
```

## Examples

### Example 1: "Review the API my generator built"
**Output**:
```
[APID-01] POST /getUserData → GET /v1/users/:id (nouns, not verbs).
[APID-02] Every response is 200 — map failures to 4xx/5xx; 201+Location for creates.
[APID-03] Three different error shapes across routes — standardize {error:{code,message,details}}.
[APID-04] GET /v1/orders unpaginated — cursor pagination before it meets real data.
```

### Example 2: "Building a public API for partners"
**Output**:
```
GraphQL hardening [APID-14]:
 1. Production config: introspection disabled; verify by sending an __schema query - it must be refused.
 2. Add a depth limit and a complexity/cost limit with a ceiling; reject beyond it.
 3. Cap batched operations per request and alias repetition, or a rate-limited mutation is brute-forceable.
 4. Walk every resolver, nested ones included: who is allowed to see this field?
 5. Disable "did you mean" suggestions and type hints in production error responses.
Mass assignment sweep [APID-13]:
 1. grep for the pattern: req.body / request.data / params passed whole into create/update/save:
    grep -rnE "(update|create|save|insert)\((\{?\s*\.\.\.)?(req\.body|request\.data|params)" src/
 2. Replace each with named fields, or configure the validator to strip undeclared keys.
 3. Deny-list the never-writable set (role, is_admin, permissions, plan, credits, balance, verified,
    owner_id, tenant_id) and assert it in a test, so a future endpoint cannot reintroduce it.
 4. Verify: as a normal user POST role=admin / plan=enterprise to every write route; re-read the record.
Signing a partner API [APID-12]:
 1. Canonical string = timestamp + nonce + method + path + RAW body bytes (never the re-serialized object).
 2. HMAC-SHA256 with a per-consumer secret; send as a header alongside the timestamp and nonce.
 3. Server: reject clock skew > ~5 min, reject seen nonces, compare digests in constant time.
 4. Rotate per-consumer secrets independently; log verification failures (they are an attack signal).
Day-one surface: /v1 path versioning + deprecation policy [APID-07], cursor pagination [APID-04],
X-RateLimit-* + 429/Retry-After [APID-06], Idempotency-Key on unsafe ops [APID-08],
X-Request-Id echo [APID-09], one documented error shape [APID-03]. Partners integrate against
consistency, not cleverness.
```

## Do / Don't

- **Do** use status codes semantically — the code *is* the contract; `200` means success, always.
- **Do** paginate every list, standardize one error shape, and version from `/v1`.
- **Don't** put verbs in URLs or invent a new response format per endpoint.
- **Don't** let a retried request execute twice — idempotency keys on anything unsafe.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
