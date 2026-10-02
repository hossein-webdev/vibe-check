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
  version: "2.5.0"
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
| AUTH-11 | Every shared layer above the database is tenant-scoped — cache keys, search indexes, job queues, file paths, logs — and a cross-tenant test proves it | P1 if multi-tenant |
| AUTH-12 | Authorization evaluates request context, not just a stored role; internal calls re-verify; sessions are scored continuously | P2 with sensitive data (P3 otherwise) — after AUTH-01..08 are solid |
| AUTH-13 | Admin surfaces require an explicitly role-verified session; obscure paths and rate limits are secondary, and every admin action is audited | P1 if an admin panel exists |
| AUTH-14 | Every redirect target is validated against an allowlist, and the authorization-code flow carries `state` + PKCE | P1 if social/SSO login or any `?next=` redirect exists |

## When to Use This Skill

- User mentions auth, login, signup, JWT, tokens, sessions, or logout.
- User mentions permissions, roles, RBAC, admin/member/viewer, or "who can do what".
- User mentions multi-tenant / tenant isolation, or "can user A see user B's data?".
- A customer reports seeing another customer's data, or you're auditing for that risk.
- Stolen credentials, suspicious logins, zero trust, or step-up authentication come up.
- An admin panel, internal dashboard, or back-office route exists.
- The app has social login, SSO, or any redirect parameter after login or logout.
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
      - **cache keys always include the tenant id** — app-layer filtering is undone by a shared cache
        (the full shared-layer sweep is AUTH-11 below);
      - **monitor for cross-tenant reads** and alert the moment one happens — you must be able to
        answer "how long?" and "who else?" immediately; learning it from a customer is too late.

### 5. Everything above the database leaks too (AUTH-11)
Perfect row-level security buys you nothing if a layer *in front of* the database answers first. A
cache is the classic: customer A loads their dashboard, the query result gets cached **after** your
security rules ran for A — then customer B requests the same page, never reaches the database, and
is served A's revenue, invoices, and customer list. The isolation was real; it just wasn't where the
request stopped.
- [ ] **Scope every cache key to the tenant id — no exceptions.** Every cached query, page fragment,
      API response, and computed rollup carries tenant context in the key. A key of
      `dashboard:summary` is a leak; `dashboard:summary:{tenant_id}` is not. Same rule for anything
      memoized in process memory on a shared server.
- [ ] **Sweep every other shared layer**, because the cache is only the most visible one:
      **search indexes** (one index, all tenants' documents — filter at query time *and* partition),
      **background job queues** (a worker that picks up any job and runs it with ambient
      credentials), **file storage** (predictable paths, one bucket, no per-tenant prefix or signed
      URL), **logging and analytics pipelines** (one tenant's records readable in another's export),
      and any **rate-limit or feature-flag store** keyed on something global. The rule is simple: if
      a layer can't tell you which tenant it is serving, it should not be serving anything.
- [ ] **Prove it with a cross-tenant test, and keep it in CI.** Log in as tenant A, load a page; log
      out; log in as tenant B, load the same page; assert none of A's data appears. Repeat for the
      search endpoint, a file URL, and an export. It takes ten minutes to write and it is the only
      thing standing between you and finding out from a customer.

### 6. When the role isn't enough (AUTH-12)
A stolen password produces a session that looks exactly like the real user: same role, same
permissions, same access — at 3am, from a country the account has never touched, on a device it has
never seen. A static role can't tell those apart because it was decided once and never revisited.
**Do the basics first** — most apps need AUTH-01..08 working before this is the best use of a week —
but once you hold financial, health, or other sensitive data, three additions change the shape of a
credential theft:
- [ ] **Evaluate attributes, not just the role.** A policy check on each request that considers time
      of day, location, device fingerprint, IP reputation, and the sensitivity of the data being
      requested. Same role, different context, different answer: routine reads pass, an unrecognized
      device pulling financial records at 3am gets stepped-up authentication or a refusal. Start with
      one policy on your most sensitive endpoint rather than a general-purpose engine.
- [ ] **Drop the perimeter assumption.** Generated services trust anything already inside the
      network, so one foothold reaches everything. Every internal call — service to service, job to
      database, function to function — carries and re-verifies identity and authorization
      (pairs with AUTH-09's scoped credentials). "It came from inside" is not an authorization.
- [ ] **Score the session continuously, not once at login.** Watch for the patterns that only appear
      mid-session: impossible travel between requests, a sudden jump in volume of records read, an
      attempt to escalate privileges. Shifts trigger a challenge or terminate the session
      automatically, and every one of those events belongs in the audit trail
      (→ `observability` OBS-14).
- [ ] Keep the failure mode kind: a false positive should cost a legitimate user one extra
      verification step, never a lockout with no path back.

### 7. The admin panel is on the public internet (AUTH-13)
A generator builds an admin panel so you can manage users, view orders, and change settings — and
puts it at `/admin` with no login screen, because it assumed only you would know the URL. Your domain
is public, the path is the first thing every automated scanner tries, and "nobody knows about it" has
never been an access control. Assume it has already been found:
- [ ] **Authenticate every admin route, and check the role, not just the session.** No admin page
      renders without a verified session belonging to a user with explicit admin privileges. A
      logged-in *ordinary* user reaching an admin route is the same breach one step later — this
      is AUTH-06 and AUTH-07 applied to the surface that matters most.
- [ ] **Treat the path as noise reduction, never protection.** Moving off `/admin`, `/dashboard`,
      `/manage` cuts the scanner traffic, and rate-limiting the admin login blunts brute force. Both
      are worth doing and neither is the control; if the only thing between the internet and your
      user table is an unusual URL, you have no control at all.
- [ ] **Log every admin action.** Who signed in, when, from where, what they changed, and every
      failed attempt (→ `observability` OBS-14). Without it, the question after an incident —
      *what did they see, and what did they change?* — has no answer, and you're guessing at the
      breach notification.
- [ ] Consider requiring a second factor and, where it fits your setup, restricting admin routes to
      a known network or an authenticated proxy. The blast radius here is the whole business.

### 8. Where you send the user next (AUTH-14)
Three separate failures share one root cause {EM} a redirect target nobody validated {EM} and a
generator produces all three because each is the shortest way to write the feature:
- [ ] **Allowlist the redirect target, don't reflect it.** `?next=`, `?returnTo=`, `?redirect=` on
      login and logout get compared against a list of permitted paths or hosts; anything else goes to
      your default. Reflecting whatever arrived turns your own login page into a credible phishing
      hop {EM} the domain in the address bar is yours, the destination is theirs. Match on the parsed
      host, not a prefix: `yourapp.com.evil.test` and `//evil.test` both pass a naive
      `startsWith` check.
- [ ] **Register exact `redirect_uri` values with the identity provider**, full strings with no
      wildcards and no open subpaths, and have your own callback re-check the one it was handed.
      Provider-side registration is the control that actually holds; app-side checking catches the
      provider you configured loosely two years ago.
- [ ] **Carry `state` and verify it on return.** A random, single-use value bound to the user's
      session, compared on the callback and then discarded. Without it anyone can replay a callback
      at your endpoint and have you complete a login the user never started {EM} and the same value is
      your CSRF defence for the login flow itself (pairs with `app-security` SEC-15).
- [ ] **Use PKCE for the authorization-code flow**, including on confidential server-side clients
      where it costs nothing. An intercepted code is worthless without the verifier, which is what
      turns code interception on a hostile network from a login into a failure.
- [ ] Test it the way an attacker would: hand your own login an external `next=`, a protocol-relative
      `//host`, and a callback with a `state` you invented. All three should be refused.

### 9. Enterprise SSO — the procurement gate (AUTH-10)
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

### 10. Machine-to-machine (AUTH-09)
- [ ] Services prove their own identity; a leaked service token is high blast radius — scope
      narrowly and rotate.

## Fix playbook

```text
Redirect hardening [AUTH-14]:
 1. grep for next=|returnTo=|redirect=|callbackUrl= ; each one gets an allowlist check, not a reflect.
 2. Parse the URL and compare the HOST (reject //host and yourapp.com.evil.test); default on mismatch.
 3. Provider console: exact redirect_uri strings, no wildcards. Re-check the value in your callback.
 4. Add state (random, session-bound, single-use, verified then discarded) + PKCE on the code flow.
 5. Try to break it: external next=, protocol-relative //host, invented state. All three must fail.
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
- **Don't** reflect a redirect target back to the browser; allowlist it or use your default.
- **Don't** rely on hidden UI as a permission; don't trust generated auth unverified.
- **Don't** ship never-expiring tokens or client-only logout.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
