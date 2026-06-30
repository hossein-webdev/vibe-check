---
name: app-security
description: >
  Hardens an app against the security mistakes AI code generators make by default: API keys ending up
  in front-end JavaScript, secrets hard-coded and never rotated, database tables left world-readable
  (no row-level security), vulnerable or abandoned dependencies, missing security headers, and unescaped
  input (XSS). Activates when the user mentions security, exposed or leaked keys, secrets management,
  RLS, OWASP/ZAP/Burp, dependency or supply-chain risk, CORS/CSP, secret scanning, a self pen-test, or
  asks "is my app secure / can someone steal my keys?".
user-invokable: true
metadata:
  category: app-security
---

# App Security

Code generators place secrets and queries wherever they're convenient for the code, with no sense of
which side of the network that code runs on — so keys land in the browser and tables ship wide open.
Security isn't a feeling; it's a short list of checks you actually run. Applies to every app.

Freedom: **low** — run the checks exactly. The failure modes here leak data, drain accounts, and sink
products.

## When to Use This Skill

- User mentions security, a leaked/exposed key, secrets, `.env`, or "is my app secure?".
- User mentions RLS, world-readable tables, OWASP, ZAP, Burp, CORS, CSP, XSS, or a pen test.
- User mentions dependency/supply-chain risk, CVEs, or `npm audit`.
- User is about to launch with no security review.
- User shipped via an AI builder and never checked where the keys live.

## Checklist (run in order; stop and fix on any failure)

### 1. Secrets in the client — the 60-second check
- [ ] Open the live app → `F12` → **Sources** → search for `key`. If an API/DB secret is sitting in
      front-end JavaScript, treat it as already public and move it server-side now.
- [ ] No secret is hard-coded in the repo. A long-lived embedded key is a standing liability.
- [ ] Secrets live in a **secrets manager** or environment variables, ideally **short-lived and
      auto-expiring**, scoped per service (e.g. Vault).
- [ ] Have a **rotation** path (dual keys so rotating causes no downtime). Assume any key eventually leaks.

### 2. Git history
- [ ] Scan the **whole commit history**, not just the latest — a removed key still lives in old commits.
- [ ] Turn on **secret scanning**. Automated bots watch public repos for keys; rotate anything that ever
      landed in a commit.

### 3. Data exposure (row-level security)
- [ ] No table is readable by default. Turn on **row-level security** so the database itself enforces
      who can see which rows, even if the application layer has a bug.
- [ ] Don't quietly undo it: a route that queries with a privileged/service role **bypasses** RLS. Use
      the requesting user's scoped access for user data.

### 4. Dependencies / supply chain
- [ ] Audit the **full dependency tree** — most of what you ship was pulled in transitively and never
      chosen by you; some of it has known vulnerabilities.
- [ ] **Pin** versions and confirm packages are still maintained (generators love abandoned libraries).
- [ ] Run `npm audit` (or your ecosystem's equivalent) and clear critical/high findings.

### 5. Headers & input
- [ ] Configure **security headers** (CORS, CSP) so the browser's built-in defenses are actually on.
- [ ] Validate and escape all input — assume generated code does **not** protect against XSS.

### 6. Attack your own app first
- [ ] Run **OWASP ZAP** (free, one container) to crawl the app and test common vulnerabilities; reach
      for **Burp Suite** when you need deeper testing.
- [ ] Sort findings by severity and fix the critical ones. A first scan almost always turns up issues
      you assumed were fine.
- [ ] A handful of these checks already puts you ahead of most AI-built apps.

## Examples

### Example 1: "Is my API key safe?"
**Action**: Run the client-secret check.
**Output**:
```
F12 → Sources → search "key":
- Found a live secret in the bundle  →  critical. Every visitor has it.
Fix: move the call server-side, rotate the key, store it in a secrets manager, then scan git history.
```

### Example 2: "Adding an AI feature — security concerns?"
**Action**: Server-side key + locked-down endpoint.
**Output**:
```
1. The provider key stays server-side, never in client JS.
2. Put the AI endpoint behind a gateway with input validation + per-user spend caps  (→ ai-engineering).
3. If it reads user data, turn on RLS; run a scan before launch.
```

## Do / Don't

- **Do** assume every key leaks — scan history and keep a rotation path.
- **Do** enforce access in the database (RLS), and verify the API doesn't bypass it.
- **Don't** trust generated auth, crypto, or input handling without review.
- **Don't** launch without running at least one self pen-test.
