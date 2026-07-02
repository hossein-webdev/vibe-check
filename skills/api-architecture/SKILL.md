---
name: api-architecture
description: >
  Establishes a real backend boundary and makes APIs reliable to consume: keep the front-end for
  presentation, move logic, validation, and secrets behind a backend layer between the client and
  the database, and ship APIs with clear contracts, versioning, and a changelog. Activates when the
  user mentions backend architecture, the front-end querying the database directly, business logic
  in the client, API contracts, API versioning, or changelogs. Applies to apps with a backend or
  API.
user-invokable: true
metadata:
  category: api-architecture
  version: "2.0.0"
---

# API & Backend Architecture

A common generated shortcut is letting the front-end talk straight to the database — which exposes
secrets, skips validation, and lets the client run whatever it likes. The fix is a real backend
layer between client and data, with APIs designed to be consumed without breaking.

Skip if the app is purely static/client-side. Freedom: **medium**.

## Rules

| ID | Check | If it fails |
|---|---|---|
| API-01 | Client never queries the database directly — a backend boundary exists | P1 |
| API-02 | Business logic, validation, and secrets live server-side only | P1 |
| API-03 | Every endpoint has a contract (inputs, outputs, errors) | P2 |
| API-04 | API versioned from day one (e.g. /v1) | P2 once consumed externally |
| API-05 | Changes tracked in a changelog consumers can follow | P3 |

## When to Use This Skill

- The front-end queries the database directly, or holds business logic and secrets.
- User mentions adding a backend/API layer or separating concerns.
- User mentions API contracts, request/response schemas, versioning, or a changelog.
- An API's consumers keep breaking whenever it changes.

## How It Works

1. **The front-end presents; it doesn't decide (API-02).** Business logic, validation, and secrets
   move to the server. The client renders data and gathers input — nothing trust-sensitive.
2. **Add the backend boundary (API-01).** Client → your API → database, never client → database.
   Auth checks, rate limits, and validation live at the boundary (→ `auth-access`, `app-security`).
3. **Design APIs to be consumed (API-03..05):** a contract per endpoint (inputs/outputs/errors);
   **version from day one** so changes don't break existing clients; a changelog so consumers can
   track what changed and when.

## Fix playbook

```text
Client queries DB directly [API-01/02]:
 1. Create a server route per data need: auth check → input validation → scoped query.
 2. Move the DB credential server-side; rotate it (→ secrets-management).
 3. Point the client at the new routes; remove the DB SDK from client bundles.
Consumers break on changes [API-03..05]:
 1. Write the contract per endpoint (OpenAPI or typed schema).
 2. Prefix routes /v1; breaking change = /v2, never a silent mutation.
 3. CHANGELOG.md per release; deprecate with dates, don't vanish endpoints.
```

## Examples

### Example 1: "My front-end calls the database directly with the public key"
**Output**:
```
[API-01] Add the boundary: client → your API (auth + validation + rate limit) → database.
Rotate the exposed credential; strip the DB SDK from the bundle [API-02].
```

### Example 2: "Every API change breaks a client"
**Output**:
```
[API-03/04/05] Contract per endpoint → /v1 versioning → published changelog.
Breaking changes get a new version, not a silent edit.
```

## Do / Don't

- **Do** keep logic, validation, and secrets behind the server; version from day one.
- **Do** document contracts and changes.
- **Don't** let the front-end query the database directly.
- **Don't** ship breaking API changes without a version bump and a changelog entry.
