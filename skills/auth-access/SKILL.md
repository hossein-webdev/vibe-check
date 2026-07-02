---
name: auth-access
description: >
  Fixes authentication and authorization — the area where a quiet bug lets one user read another
  user's data. Covers the core rules: use a real auth provider instead of building your own, keep
  authentication and authorization separate, common JWT mistakes (accepting "none"), session
  expiration and rotation, role-based access enforced on the server, multi-tenant isolation, and
  choosing a provider (Clerk, Auth0, BetterAuth). Activates when the user mentions auth, login, JWT,
  tokens, sessions, permissions, roles, RBAC, multi-tenant isolation, or "can user A see user B's
  data?". Applies only to apps with user accounts or protected data.
user-invokable: true
metadata:
  category: auth-access
  version: "2.0.0"
---

# Authentication & Access Control

Logging a user in is the easy half. The hard half is making sure that, once in, they can only touch
what's theirs — and generated auth often looks finished while hiding weak hashing, tokens that never
expire, or checks that live only in the UI.

Skip if the app has no accounts or protected data. Otherwise, freedom: **low** — one bug here puts
the whole product at risk. **When the audit detects hand-rolled auth (raw jwt/bcrypt usage), run
every check below at maximum strictness — assume nothing.**

## Rules

| ID | Check | If it fails |
|---|---|---|
| AUTH-01 | A dedicated auth provider is used (or hand-rolled auth fully verified) | P2 (P1 if hand-rolled + unverified) |
| AUTH-02 | No plain-text passwords; strong hashing | P1 |
| AUTH-03 | JWT: `alg:none` rejected, algorithm pinned, expiry enforced | P1 |
| AUTH-04 | Sessions expire + rotate; logout invalidates server-side | P2 |
| AUTH-05 | Cross-user access explicitly tested (A cannot fetch B's record) | P1 |
| AUTH-06 | Access enforced at the API layer, not by hiding UI | P1 |
| AUTH-07 | RBAC modeled permissions-first (roles = permission bundles) | P2 |
| AUTH-08 | Tenant isolation is a deliberate strategy, backed by RLS | P1 if B2B |
| AUTH-09 | Service-to-service credentials scoped + rotated | P2 |

## When to Use This Skill

- User mentions auth, login, signup, JWT, tokens, sessions, or logout.
- User mentions permissions, roles, RBAC, admin/member/viewer, or "who can do what".
- User mentions multi-tenant / tenant isolation, or "can user A see user B's data?".
- User is choosing or wiring a provider (Clerk, Auth0, BetterAuth, Supabase Auth).
- The app's auth was hand-written or generated from scratch.

## Checklist

### 1. Don't build it — adopt it (AUTH-01)
- [ ] Use a dedicated provider; identity is infrastructure and subtle mistakes are expensive.
- [ ] Pick by customer: **Clerk** fast flexible product auth · **Auth0** enterprise compliance +
      federation · **BetterAuth** self-hosted ownership (you own UI + uptime).

### 2. Authentication (AUTH-02..04)
- [ ] Treat generated auth as unverified: no plain-text passwords, strong hashing, sane tokens.
- [ ] JWTs: reject `none`, pin the algorithm, require expiry — closes the usual forgery paths.
- [ ] Sessions expire and rotate; **logout invalidates server-side**, not just a client delete.

### 3. Authorization — the part that gets skipped (AUTH-05..07)
- [ ] Logged-in ≠ allowed. As user A, fetch user B's record by id. If data returns, that's a breach.
      If you haven't tested it, assume it fails.
- [ ] Enforce every rule on the **server/API** — hiding buttons is not security.
- [ ] Model permissions first; roles are bundles. `admin / member / viewer` covers most apps.

### 4. Multi-tenant isolation (AUTH-08)
- [ ] Isolation is a decision, not the ORM default. Back it with **RLS** so an app bug can't cross
      tenants (→ `app-security` SEC-04).

### 5. Machine-to-machine (AUTH-09)
- [ ] Services prove their own identity; a leaked service token is high blast radius — scope
      narrowly and rotate.

## Fix playbook

```text
Hand-rolled auth found [AUTH-01 strict]:
 1. Verify hashing (bcrypt/argon2, salted) — plain text = stop-ship, force resets after fix.
 2. JWT config: reject none, pin alg, set exp + rotation.
 3. Plan migration to a provider; custom auth is ongoing liability, not a one-time fix.
Cross-user leak [AUTH-05/06]:
 1. Add ownership checks in every route handler (user_id from session, never from request body).
 2. Add RLS as the backstop; re-run the A-reads-B test to verify.
```

## Examples

### Example 1: "Login works — am I done?"
**Output**:
```
Login = authentication only. Test authorization [AUTH-05]: as user A, request user B's record —
data back = breach. Move checks server-side [AUTH-06], add roles [AUTH-07], back with RLS.
```

### Example 2: "Clerk or Auth0?"
**Output**:
```
Selling to SMB / fast flexible UX → Clerk. Enterprise compliance/federation → Auth0.
Own the data / self-host → BetterAuth (you run UI + reliability). Never hand-roll [AUTH-01].
```

## Do / Don't

- **Do** adopt a provider; verify JWT alg + expiry; enforce on the server.
- **Do** explicitly test cross-user and cross-tenant access.
- **Don't** rely on hidden UI as a permission; don't trust generated auth unverified.
- **Don't** ship never-expiring tokens or client-only logout.
