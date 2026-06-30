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
---

# Authentication & Access Control

Logging a user in is the easy half. The hard half is making sure that, once in, they can only touch
what's theirs — and generated auth often looks finished while hiding weak hashing, tokens that never
expire, or checks that live only in the UI.

Skip this skill entirely if the app has no accounts or protected data. Otherwise, freedom: **low** —
this is infrastructure, and one bug here puts the whole product at risk.

## When to Use This Skill

- User mentions auth, login, signup, JWT, tokens, sessions, or logout.
- User mentions permissions, roles, RBAC, admin/member/viewer, or "who can do what".
- User mentions multi-tenant / tenant isolation, or "can user A see user B's data?".
- User is choosing or wiring an auth provider (Clerk, Auth0, BetterAuth, Supabase Auth).
- The app's auth was hand-written or generated from scratch.

## Checklist

### 1. Don't build it — adopt it
- [ ] Use a dedicated **auth provider** rather than rolling your own. Identity is infrastructure, and a
      single subtle mistake is expensive.
- [ ] Pick by who you're selling to: **Clerk** for fast, flexible product auth; **Auth0** when you need
      enterprise compliance and federation; **BetterAuth** when you want to self-host and own the data
      (you also own the UI and uptime).

### 2. Get authentication right
- [ ] Treat generated auth as unverified — confirm passwords aren't stored in plain text, hashing is
      strong, and tokens are sane.
- [ ] For **JWTs**: reject the `none` algorithm, pin the expected algorithm, and require expiry. Those
      three close the usual token-forgery paths.
- [ ] **Sessions** expire and rotate, and **logout actually invalidates** the session on the server —
      not just a client-side delete.

### 3. Authorization — the part that gets skipped
- [ ] Being logged in is not the same as being allowed. After login, check whether one user can fetch
      another's record by id. If you haven't tested it, assume they can.
- [ ] Enforce every access rule **on the server / API**, never by hiding buttons in the UI.
- [ ] Model roles deliberately: permissions first, roles as bundles of permissions, scoped narrowly.
      `admin / member / viewer` covers most apps to start.

### 4. Multi-tenant isolation
- [ ] If multiple customers share the system, isolation is a **decision you make**, not whatever the
      ORM happened to default to.
- [ ] Back it with **row-level security** in the database (see `app-security`) so an application bug
      can't leak across tenants.

### 5. Service-to-service
- [ ] Machine-to-machine auth is different from user login: each service proves its own identity, and a
      leaked service credential is high-impact — scope and rotate them.

## Examples

### Example 1: "Login works — am I done?"
**Action**: Separate authentication from authorization; run the cross-user test.
**Output**:
```
Login covers authentication only. Authorization is untested:
1. As user A, request user B's record by id — if data comes back, that's a breach.
2. Move all access checks to the server; add roles (admin/member/viewer).
3. Add row-level security so the database enforces it even if a route forgets.
```

### Example 2: "Clerk or Auth0?"
**Action**: Decide by target customer.
**Output**:
```
- Selling to small teams / want fast, flexible UX  → Clerk.
- Selling to enterprise / need compliance + federation  → Auth0.
- Need to own the data / self-host  → BetterAuth (you run the UI + reliability).
Whatever you pick: don't hand-roll it.
```

## Do / Don't

- **Do** adopt a provider; verify JWT algorithm + expiry; enforce access on the server.
- **Do** explicitly test cross-user and cross-tenant access.
- **Don't** rely on a hidden UI element as a permission.
- **Don't** ship tokens that never expire or a logout that only clears the client.
