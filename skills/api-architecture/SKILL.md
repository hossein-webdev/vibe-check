---
name: api-architecture
description: >
  Establishes a real backend boundary and makes APIs reliable to consume: keep the front-end for
  presentation, move logic, validation, and secrets behind a backend layer between the client and the
  database, and ship APIs with clear contracts, versioning, and a changelog. Activates when the user
  mentions backend architecture, the front-end querying the database directly, business logic in the
  client, API contracts, API versioning, or changelogs. Applies to apps with a backend or API.
user-invokable: true
metadata:
  category: api-architecture
---

# API & Backend Architecture

A common generated shortcut is letting the front-end talk straight to the database — which exposes
secrets, skips validation, and lets the client run whatever it likes. The fix is a real backend layer
between client and data, with APIs designed to be consumed without breaking.

Skip if the app is purely static/client-side. Otherwise, freedom: **medium** — adapt to your stack.

## When to Use This Skill

- The front-end queries the database directly, or holds business logic and secrets.
- User mentions adding a backend/API layer or separating concerns.
- User mentions API contracts, request/response schemas, versioning, or a changelog.
- An API's consumers keep breaking whenever it changes.

## How It Works

1. **The front-end presents; it doesn't decide.** Move business logic, validation, and secrets to the
   server. The client renders data and gathers input — nothing trust-sensitive.
2. **Add the backend boundary.** Put a server layer between the front-end and the database so the client
   never touches the database directly. Auth checks, rate limits, and validation live here (see
   `auth-access`, `app-security`).
3. **Design APIs to be consumed, not just to work:**
   - define a clear **contract** per endpoint (inputs, outputs, errors),
   - **version** from the start so changes don't break existing clients,
   - keep a **changelog** so consumers can track what changed and when.

## Examples

### Example 1: "My front-end calls the database directly with the public key"
**Action**: Introduce the backend boundary.
**Output**:
```
Direct client → database access leaks secrets and skips validation.
Add a server layer: client → your API (auth + validation + rate limit) → database.
Keep secrets and business rules on the server only.
```

### Example 2: "Every API change breaks a client"
**Action**: Contracts, versioning, changelog.
**Output**:
```
1. Write a contract per endpoint (request/response/error shapes).
2. Version the API (e.g. /v1) so existing clients keep working.
3. Publish a changelog for every change.
```

## Do / Don't

- **Do** keep logic, validation, and secrets behind the server.
- **Do** version APIs from the start and document changes.
- **Don't** let the front-end query the database directly.
- **Don't** ship breaking API changes without a version bump and a changelog.
