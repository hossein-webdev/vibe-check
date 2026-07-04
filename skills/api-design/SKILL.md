---
name: api-design
description: >
  Designs the API surface itself so it's consistent, predictable, and safe to consume: resource
  naming, HTTP method and status-code semantics (including never returning 200 for failures), a
  standard error shape, pagination (cursor vs offset), filtering and sorting conventions, rate-limit
  headers, versioning with a deprecation policy, idempotency keys for retried operations, and
  request-id echoing. Activates when the user is designing or reviewing API endpoints, mentions REST
  conventions, resource naming, status codes, pagination, filtering, error responses, API
  versioning/deprecation, idempotency, or building a public/partner API. Applies to any app that
  exposes an API. (For where the API sits — the backend boundary — use api-architecture.)
user-invokable: true
metadata:
  category: api-architecture
  parent: api-architecture
  version: "2.2.0"
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
- Publish the contract + a changelog per change (`api-architecture` API-03/05).

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
