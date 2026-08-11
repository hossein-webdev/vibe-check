---
name: secrets-management
description: >
  Deep-dive on keeping API keys, database credentials, and signing secrets out of the wrong hands —
  the single most common way vibe-coded apps get burned. Covers the 60-second client-exposure check,
  hard-coded keys, secrets managers and dynamic short-lived credentials, zero-downtime rotation, git
  history scanning (deleted keys live forever in commits), and automated bot scanning of public
  repos. Activates when the user mentions API keys, leaked/exposed/stolen keys, .env files, secrets,
  credentials, key rotation, Vault, secret scanning, or "someone is using my API key". Child of
  app-security; applies to every app that uses any credential.
user-invokable: true
metadata:
  category: app-security
  parent: app-security
  version: "2.1.0"
---

# Secrets Management

Code generators put the key where the code needs it — they don't think about where the code *runs*.
That one habit ships more real-world damage than any other: a founder's exposed payment key can be
drained in hours, and bots scan public repos for fresh keys continuously. Assume every key leaks
eventually; build so a leak is survivable.

Freedom: **low** — run the checks exactly.

## Rules

| ID | Check | If it fails |
|---|---|---|
| SEC-01 | No secret is hard-coded or git-tracked (`.env*` untracked; only `.env.example` in git) | P1 |
| SEC-02 | No secret reachable from the client (bundle, component code, `NEXT_PUBLIC_*`) | P1 |
| SEC-03 | Git history is clean or rotated; secret scanning enabled; rotation path exists | P2 |
| SEC-12 | A pre-commit hook (or push protection) blocks secrets before they ever reach the remote | P2 — the only control that makes the fix permanent |

## When to Use This Skill

- User mentions API keys, secrets, credentials, `.env`, or a leaked/exposed key.
- User asks "can someone steal my key?" or reports surprise usage on a provider account.
- User mentions rotation, Vault, secret scanning, or moving secrets to a manager.
- A scan found secret-looking strings and they need judging (real vs sample vs test).

## Checklist (in order)

### 1. Client exposure — the 60-second check (SEC-02)
- [ ] Open the live app → `F12` → **Sources** → search `key`, `secret`, `sk_`. Anything found in
      front-end JS is public to every visitor — move the call server-side **now**.
- [ ] Framework prefixes that ship to the browser (`NEXT_PUBLIC_*`, `VITE_*`, `EXPO_PUBLIC_*`) must
      never hold real secrets — only site URLs, analytics IDs, and other safe-to-publish values.
- [ ] In an SPA, *everything* in the bundle is public. If the app needs a secret, it needs a server.

### 2. Hard-coding & storage (SEC-01)
- [ ] `git ls-files | grep .env` returns nothing except `.env.example`. A tracked env file is a P1
      even in a private repo — history is forever and access lists grow.
- [ ] No literal keys in source. Secrets come from env vars or a **secrets manager**; prefer
      **dynamic, auto-expiring, per-service credentials** (e.g. Vault) over static ones — a static
      credential is a permanent attack surface.

### 3. History, scanning, rotation (SEC-03)
- [ ] Scan the **entire git history**, not just HEAD — a deleted key still lives in old commits
      (`gitleaks detect` or GitHub secret scanning). Anything that ever touched a commit: rotate.
- [ ] Enable secret scanning on the repo/platform. Bots find fresh keys in public repos in minutes.
- [ ] Have a **dual-key rotation** path (issue new key → deploy → revoke old) so rotating never
      causes downtime — then actually rotate on a schedule and immediately after any suspicion.

### 4. Stop it happening again (SEC-12)
Everything above is cleanup; this is the only step that makes it permanent. Roughly **seven in ten**
audited projects have a live credential in their repository — not because builders are careless, but
because a generator doesn't distinguish a config file from an environment variable, so it writes the
key inline and commits it with everything else. Cleanup you have to repeat isn't a fix:
- [ ] **Install a pre-commit hook that scans staged changes** for key, token, and credential
      patterns and rejects the commit. `gitleaks protect --staged` behind `pre-commit`, `husky`, or
      a plain `.git/hooks/pre-commit` — five minutes, once.
- [ ] **Turn on the platform's push protection too.** The hook protects your machine; push
      protection protects the repository from every other machine and from `--no-verify`.
- [ ] **After moving secrets to env vars, verify the env file is actually ignored** — `git check-ignore -v .env`
      should print the matching rule. Skipping this moves the keys from one committed file to
      another committed file, which is not a fix.
- [ ] **Give the team an escape hatch that isn't disabling the hook**: a documented way to commit a
      deliberate test fixture (an allowlist entry with a comment) so nobody learns the habit of
      passing `--no-verify`.

## Fix playbook

```bash
# Block secrets at commit time (SEC-12)
pip install pre-commit && cat >> .pre-commit-config.yaml <<'YAML'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks: [{ id: gitleaks }]
YAML
pre-commit install          # now every commit is scanned
git check-ignore -v .env    # must print a matching .gitignore rule

# Untrack a committed env file (SEC-01)
git rm --cached .env.local && echo ".env.local" >> .gitignore && git commit -m "untrack env"
# then ROTATE every value it contained — untracking does not un-leak history

# Scan full history for secrets (SEC-03)
gitleaks detect --source . --log-opts="--all"

# Judge a scanner hit: sample/test or real?
#  - postgres://user:pass@localhost or in ci.yml → test fixture, fine
#  - sk_live_/AKIA/private key in src/ or bundle → real, rotate now
```

## Examples

### Example 1: "Is my OpenAI key safe?"
**Output**:
```
F12 → Sources → search "sk-": found in main-*.js  → [SEC-02] P1 · Confirmed.
Every visitor can bill your account. Fix: proxy the call through a server route, rotate the key,
put the new one in the host's env panel. Verify: rebuilt bundle greps clean; old key revoked.
```

### Example 2: "I deleted the .env from the repo, are we good?"
**Output**:
```
No — the file lives in history. [SEC-03]:
1. gitleaks detect --log-opts="--all"  → confirm what leaked
2. Rotate every credential it held (dual-key: add new, deploy, revoke old)
3. Enable secret scanning so the next slip is caught in minutes.
```

## Do / Don't

- **Do** treat any key that ever touched a commit as leaked — rotate it.
- **Do** keep secrets server-side, in a manager, short-lived where possible.
- **Do** block secrets at commit time — cleanup you repeat every few months isn't a fix.
- **Don't** put real secrets in `NEXT_PUBLIC_*` / `VITE_*` / client code — ever.
- **Don't** confuse untracking a file with revoking its contents.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
