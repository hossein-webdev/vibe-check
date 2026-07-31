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
| AUTH-04 | Sessions expire + rotate; logout invalidates server-side; concurrent-session cap; instant revocation on credential change | P2 (P1 for financial/health data) |
| AUTH-05 | Cross-user access explicitly tested (A cannot fetch B's record) | P1 |
| AUTH-06 | Access enforced at the API layer, not by hiding UI | P1 |
| AUTH-07 | RBAC modeled permissions-first (roles = permission bundles) | P2 |
| AUTH-08 | Tenant isolation is a deliberate strategy, backed by RLS | P1 if B2B |
| AUTH-09 | Service-to-service credentials scoped + rotated | P2 |
| AUTH-10 | Enterprise SSO ready (SAML 2.0/OIDC, per-tenant IdP config); provider's own compliance docs available; migration path known | P2 if selling to enterprise |

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
- [ ] **Manage the session, not just the login.** Frameworks default to sessions that effectively
      never end, and the generator keeps the default — so a login from six months ago (or the laptop
      lost at a café) still has full access right now:
      - **Pick a lifetime from data sensitivity** — financial or health data: hours; low-risk
        content: days. That's an engineering decision you make, not a default you inherit.
      - **Cap concurrent sessions per user** — one account live on fifteen devices is invisible
        otherwise, and stolen credentials ride an existing session while the real user notices
        nothing.
      - **Revoke instantly on credential change** — a password change must kill *every* active
        session for that user immediately, not at the next token refresh. Otherwise the reset is a
        false sense of security while the attacker keeps their session.
- [ ] **Handle the full token lifecycle**, not just the initial login (the generated OAuth gap that
      dumps users to a login screen mid-work every hour):
      - **silent refresh** — renew the access token in the background before its ~60-minute expiry;
      - **graceful refresh failure** — when the refresh token expires, reauthenticate with **state
        preserved** (no blank page, lost draft, or cleared cart — return the user where they were);
      - **rotate refresh tokens on every use** — a stolen token that works forever is a permanent
        backdoor; a rotated one works once, and reuse flags the compromise.

### 3. Authorization — the part that gets skipped (AUTH-05..07)
- [ ] Logged-in ≠ allowed. As user A, fetch user B's record by id. If data returns, that's a breach.
      If you haven't tested it, assume it fails.
- [ ] Enforce every rule on the **server/API** — hiding buttons is not security.
- [ ] Model permissions first; roles are bundles. `admin / member / viewer` covers most apps.

### 4. Multi-tenant isolation (AUTH-08)
- [ ] Isolation is a decision, not the ORM default. Back it with **RLS** so an app bug can't cross
      tenants (→ `app-security` SEC-04).
- [ ] **Know the breach anatomy** — "I'm seeing someone else's dashboard" starts with something
      tiny (a missing WHERE clause, or a **cache key that omits tenant context** serving the wrong
      tenant's data) and cascades into legal duty (notify the exposed tenant; HIPAA fines; GDPR
      filing within 72 hours) and trust damage that outlives the fix. Two implications:
      - **cache keys always include the tenant id** — app-layer filtering is undone by a shared cache;
      - **monitor for cross-tenant reads** and alert the moment one happens — you must be able to
        answer "how long?" and "who else?" immediately; learning it from a customer is too late.

### 5. Enterprise SSO — the procurement gate (AUTH-10)
- [ ] If you sell to companies, **SSO is a gate, not a feature request**: line one of the IT
      procurement checklist is "SAML/OIDC support?", and Google sign-in + email/password doesn't
      count. Employees authenticate through the corporate IdP (Okta, Azure AD, Google Workspace) or
      IT doesn't approve the purchase.
- [ ] Implement **SAML 2.0 / OIDC** properly — handshake, assertion validation, attribute mapping,
      session management — *before* the checklist arrives, not after.
- [ ] Design **multi-tenant SSO** from the start: every customer brings a different IdP. One
      integration pattern, per-tenant credentials and configuration.
- [ ] **Audit the provider you chose, not just your integration.** The provider picked for the free
      tier and the nicest developer docs gets examined by the buyer's security team, who ask a
      different set of questions:
      - **Can it do SAML/SSO at all?** Enterprises don't create accounts on your platform — they
        authenticate through their own IdP. Asking a 10,000-employee company to manage separate
        credentials loses to the competitor that doesn't.
      - **Can the provider produce its own compliance documentation?** Procurement audits your whole
        *vendor* stack; a provider with nothing to show gets flagged as risk and the deal stalls.
      - **What does leaving cost?** Know the migration path *before* thousands of paying users sit
        on a provider you've outgrown — evaluating it later is exponentially harder.

### 6. Machine-to-machine (AUTH-09)
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

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
