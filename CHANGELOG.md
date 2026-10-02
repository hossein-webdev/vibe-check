# Changelog

## 4.20.0

**APID-13 — accept the fields you meant to accept.** APID-11 keeps extra fields out of the *response*;
this is the same discipline inbound, and it's the one that ends in privilege escalation. The generated
handler passes the body straight to the ORM — `update(id, req.body)`, `Model(**payload)`,
`{ ...user, ...req.body }` — because that's the shortest correct-looking code, and it lets the client
decide which columns get written.

- **Allowlist writable fields per endpoint.** A schema that validates the fields you expect but passes
  the whole object through is not an allowlist: build the object from named fields, or configure the
  validator to strip what it didn't declare. The profile endpoint takes `name` and `avatar_url`; it does
  not take `role`, however carefully it checks the name.
- **Name the never-writable set** and keep it out of every write path — `role`, `is_admin`,
  `permissions`, `plan`, `credits`, `balance`, `verified`, `owner_id`, `tenant_id`, and anything billing
  reads (BIZ-01 for the money consequence). Changing those is an operation with its own endpoint and
  authorization, not a field on a general update.
- **Nested objects are the same hole one level down** — apply the allowlist at every level you accept.
- **Automated review passes this**, because nothing is malformed and the code does exactly what it says.
  That's why it's a checklist item rather than something to expect a tool to catch (PROD-09).
- **Test it directly**: as an ordinary user, send `role: "admin"` to every write endpoint, then read the
  record back. Nothing should have changed.

`api-design` 2.12.0. Global mirror synced.

## 4.19.0

**AUTH-15 — a link in an inbox is a credential.** Password resets, magic links and invitations all hand
someone a URL that logs them in. Generators build generate-email-accept and leave out the lifecycle, so
the link keeps working long after it should.

- **Expire in minutes, not days.** Fifteen minutes is generous — the user is reading the email now. A
  token that still authenticates months later is a permanent password sitting in an inbox that may be
  compromised, forwarded, or archived on a shared machine.
- **Burn on first use, atomically** — consumed in the same statement that validates it (BIZ-04), so two
  clicks can't both succeed. Issuing a new link invalidates the previous one rather than leaving a trail
  of working keys.
- **Invalidate on password change, and cut sessions.** Changing the password kills outstanding reset
  tokens; completing a reset terminates existing sessions (AUTH-04) — otherwise the person being locked
  out keeps their session, which was the whole reason for the reset.
- **Survive link prefetching.** Mail scanners open URLs without a human, so a `GET` that consumes the
  token burns it before the user clicks. Redeem on an explicit action — a `POST` on a button.
- **Don't leak it in transit**: out of logs, analytics and the `Referer`; store a hash and compare, never
  the raw value; don't disclose whether an address exists.
- Magic links: bind redemption to the requesting session or device where the UX allows, so an
  intercepted link alone isn't enough.

`auth-access` 2.6.0.

## 4.18.0

**SEC-19 — the boundary the framework drew for you.** Server-component frameworks put both sides in one
file tree and decide which side a module lands on by how it's imported. That inference is invisible, a
generator has no model of it, and it fails in two directions at once.

- **Secrets follow the import graph.** A helper reading `process.env` is server-only until a client
  component imports *anything* from the same module, at which point the bundler pulls it — and the
  credential — into the browser bundle. Different bug from the classic `NEXT_PUBLIC_` mistake: nothing
  was prefixed, nothing looked public. Guard server-only modules explicitly so a wrong import fails the
  **build** rather than shipping quietly.
- **Props are a wire format, not a function call.** Whatever a server component passes down is
  serialized into the payload the browser receives, in full. Passing a whole user record because the
  child renders three fields puts the rest — hashes, internal flags, other people's identifiers — in
  the page source. Select fields at the boundary; APID-11's discipline, applied where there's no
  visible API to review.
- **Server actions are public endpoints.** Reachable by anyone who can form the request, not only by
  the component that calls them, so each needs its own auth, authorization and validation. "Only my UI
  calls this" is an assumption about the caller, and the caller is the internet.
- **Verify by reading what shipped**, not by reasoning about the code: grep the built bundle for a known
  secret and the server-rendered HTML for a field the UI never displays. Both empty, re-checked after
  any dependency upgrade that moves the boundary.

`app-security` 2.7.0. Its description was also condensed — the accumulated keyword list had crossed the
1024-character frontmatter limit.

## 4.17.0

**SEC-18 — every vendor script runs as you.** A chat widget, an analytics pixel, a heatmap recorder:
each runs with the **same privileges as your own code**, able to read the DOM, watch keystrokes in your
login form, and read browser storage. You aren't trusting the vendor's product — you're trusting their
build pipeline, their CDN, and whoever acquires them next. `npm audit` cannot see any of it, because
nothing was installed.

- **Inventory and justify** every external script, style, font, iframe and pixel on login, checkout and
  account pages. Anything unjustified comes off — this is the step people skip and the one that shrinks
  the problem.
- **Pin what you can**: Subresource Integrity plus `crossorigin` so a swapped file fails closed. SRI
  can't cover a loader *designed* to mutate, so pin vendor and version in your own config instead of
  taking whatever `latest` serves today.
- **Restrict with CSP** so the inventory is enforced: `script-src` lists approved hosts, no
  `unsafe-inline`, no wildcards. SEC-07 covers rolling it out report-only first; this is what to point
  it at.
- **Keep auth tokens out of storage every script can read.** A token in `localStorage` is readable by
  the widget you added last week, which turns one vendor compromise into account takeover with no
  attacker code on your server. Prefer `Secure` + `HttpOnly` + `SameSite` cookies, which JavaScript
  cannot read at all; if a token must live in JS, keep it in memory, short-lived, never persisted.
- **Isolate or exclude**: a widget in a sandboxed iframe on another origin can't read your DOM or
  storage, and the pages where credentials and card details are typed should carry no vendor scripts at
  all.

`app-security` 2.6.0.

## 4.16.0

**AUTH-14 — where you send the user next.** Three failures the corpus kept surfacing turn out to be
one root cause: a redirect target nobody validated. A generator writes all three because each is the
shortest way to get the feature working.

- **Allowlist the target, don't reflect it.** `?next=`, `?returnTo=`, `?redirect=` get compared
  against permitted paths or hosts. Reflecting whatever arrived turns your own login page into a
  credible phishing hop — the domain in the address bar is yours, the destination is theirs. Match on
  the parsed host, because `yourapp.com.evil.test` and `//evil.test` both pass a naive prefix check.
- **Register exact `redirect_uri` values** with the identity provider, no wildcards, and re-check the
  value in your own callback — provider-side registration is the control that holds, app-side checking
  catches the provider you configured loosely two years ago.
- **Carry `state` and verify it**: random, session-bound, single-use, discarded after. Without it a
  callback can be replayed at your endpoint to complete a login the user never started, and the same
  value is the CSRF defence for the login flow.
- **Use PKCE on the authorization-code flow**, including confidential server-side clients where it
  costs nothing. An intercepted code is worthless without the verifier.
- Test it adversarially: an external `next=`, a protocol-relative `//host`, and an invented `state`
  should all three be refused.

`auth-access` 2.5.0.

## 4.15.0

**SEC-08 now actually covers injection.** It read *"Input validated/escaped — XSS defended"*, and
the words *SQL injection*, *parameterized query*, and *prepared statement* appeared nowhere in the
pack. For a production-readiness audit aimed at generated code — which builds queries by string
interpolation because that is the obvious way to write the feature — the most famous injection
class was missing. This is a fix to shipped content, not a new lesson.

- `app-security` (2.5.0): **SEC-08** rewritten as *untrusted input never becomes code*:
  - **Parameterized queries, always.** Bind values, never interpolate. Covers NoSQL operator
    injection and ORM `raw`/`literal` escape hatches, not just classic SQL.
  - **Identifiers can't be parameterized**, so table/column names taken from input need an
    **allowlist** — mapping a sort field to a fixed set of known columns. This is where most
    "we use an ORM so we're fine" apps still get hit.
  - **Grep for the pattern rather than reasoning about it**: query calls containing `+`, `${`, `%s`,
    f-strings, or `.format(`. Each hit is either parameterized or a finding. Least-privilege database
    roles behind it so a missed spot leaks less.
  - **Contextual output escaping** for XSS, with every framework bypass (`dangerouslySetInnerHTML`,
    `v-html`, `innerHTML`, `|safe`) treated as a review item, and CSP as the backstop rather than
    the fix.
  - **Same class, other sinks**: nothing user-supplied reaches a shell, `eval`, a deserializer, or a
    file path — command injection and path traversal are one bug with a different ending.
  - Validation framed as allowlisting shape and type at every endpoint, not blocking known-bad
    strings, with a pointer to BIZ-01 for accepting fields you didn't intend.
  - New injection-sweep entry in the fix playbook.

## 4.14.0

**New skill: `business-logic-abuse`** (BIZ-01..10) — the flaws no scanner can find, because
nothing is broken. No payload is malformed, no exception is thrown; someone used the product in an
order, at a speed, or with a number you didn't picture, and it did exactly what it was built to do.
For a pack aimed at apps that take money, this was the largest remaining hole. Pack: 23 — 24 skills.

- **BIZ-01/02** — the client names its own price. Generated checkouts post `{price, currency}` and
  charge what they're told; editing that takes seconds and leaves nothing in the logs, because
  nothing failed. Ids in, values out of your own records. Plus the bounds a "is it a number" check
  misses: negative quantities that turn purchases into refunds, and float money that rounds in the
  customer's favour until the ledger drifts.
- **BIZ-03** — one-time benefits enforced against a durable identity. One-per-account is
  one-per-email-alias when accounts are free. Cap the aggregate too, and alert on redemption rate —
  farming is a metric before it's a support ticket.
- **BIZ-04** — read, decide, write is three steps, not one. Two requests interleave and both pass
  the check: the last credit spent twice, one seat used by two people. It never reproduces manually
  because you click once. One atomic conditional update where zero rows affected *is* the rejection,
  and a parallel-request test that asserts the invariant.
- **BIZ-06..09** — limits that exist only in the UI; workflows entered by URL or self-approved;
  entitlement that never gets re-derived across delete-and-recreate, restore, or downgrade; and your
  own export button as the cheapest exfiltration path.
- **BIZ-10** — the abuse pass itself. Write the invariants down, attack them through the interface,
  keep the cases as a regression suite. Scanners look for broken code; this looks for broken rules,
  and only someone who knows the intended behaviour can do it.
- `audit`: new matrix row routing to `business-logic-abuse`; `BIZ-` added to the namespace table.

Credit: the coverage gap was identified from
[pre-production-checklist](https://github.com/FarzamHabibi/pre-production-checklist) by Farzam Habibi
(CC BY 4.0). Rules written from scratch in this pack's format; see the README credits.

## 4.13.0

**Who checks the work, and the door nobody locked.**

- `production-readiness` (2.4.0): **PROD-09** — don't let the author mark its own homework. Ask a
  model to build authentication, then ask the same model to review it, and it says the code looks
  good; of course it does, it wrote it. The blind spots that produced the vulnerability are the ones
  that miss it on review, because each model has its own default patterns and edge cases it reliably
  forgets. Run critical modules through a **different** model, frame the review adversarially ("find
  every way to break this", not "does this look good"), and rotate which model builds and which
  reviews so one set of blind spots doesn't spread across the codebase. **Where the two models
  disagree is where you should read the code yourself.** It's a cheap second opinion, not a
  replacement for PROD-08's audit or a real pen test — a second model is confidently wrong in its
  own ways too.
- `auth-access` (2.5.0): **AUTH-13** — the admin panel is on the public internet. A generator puts
  it at `/admin` with no login because it assumed only you would know the URL; that path is the first
  thing every scanner tries. Authenticate every admin route and check the **role**, not just the
  session — a logged-in ordinary user reaching an admin route is the same breach one step later.
  Moving off predictable paths and rate-limiting the login are worth doing and are noise reduction,
  never the control. Log every admin action, or the post-incident question — what did they see,
  what did they change — has no answer.
- `scaling-performance` (2.3.0): SCALE-06 now covers the two passes that come *before* the planner:
  index the columns you filter and join on (measured on realistic data volume, because on a small
  table everything looks fast, and noting indexes cost write throughput), and stop returning every
  column when the page renders three. Plus slow-query logging with a threshold, read weekly.
- `frontend-mobile-quality` (2.3.0): FE-09 gains a judgement call — TLS plus pinning is the right
  baseline and enough for most apps, but for credentials or regulated data, encrypt those fields at
  the application layer too, so one proxy misconfiguration or a body-logging middleware doesn't
  expose them. Decide by data class; it adds key management you then have to run.

## 4.12.0

**Two boundaries that were never where you thought they were** — one that a platform used to hold
for you, one that was only ever a sentence in a prompt.

- `app-security` (2.5.0): **SEC-17** — the day you leave a managed platform. Moving to your own
  server buys control and silently transfers a job you never saw being done: the platform was
  running the firewall, patching the OS, and hardening remote access invisibly, and a bare host does
  none of it. Harden SSH before anything else runs on the box (key-only, password auth off, root
  login off — and confirm the key works in a *second* session before you close the first, or you
  lock yourself out). Default-deny the firewall, and check the one that ends self-hosted moves
  badly: **a datastore port listening on a public interface**. Then turn on unattended security
  updates, because the platform patched itself and the host will sit on a known vulnerability until
  someone remembers. This is the actual content of the self-hosted-vs-managed trade in COST-04.
- `ai-engineering` (3.2.0): **AI-13** — the model is not an access-control layer. A support
  assistant that looks up orders will, given the right sentence, look up everyone's orders, because
  your instructions and the user's message arrive through the same channel and the model has no way
  to rank one above the other. "Ignore your previous instructions" isn't a clever exploit; it's the
  interface working as designed. Scope the data connection to the authenticated user **in code** —
  a session-bound connection, row-level security, or a tool whose user id the model cannot supply —
  so no phrasing changes what's reachable. Give it the narrowest surface that answers the question
  rather than the whole schema, and filter responses on the way out for system-prompt content,
  foreign identifiers, and internal structure. Prompt instructions are a preference, not a boundary.

## 4.11.0

**Three ways the browser and your dependency tree hand your perimeter away.** All security this
round, and all three are things people believe they've already handled.

- `app-security` (2.4.0): **SEC-15** — cross-origin trust. Your user visits a page they have no
  reason to distrust, it calls your API, and the browser attaches their session cookie because your
  server said every origin is welcome. `Access-Control-Allow-Origin: *` *with credentials* is the
  headline mistake; reflecting whatever `Origin` arrives is the same hole wearing a disguise, and it
  survives a casual read of the config. Hard-coded allowlist, `SameSite` + `Secure` + `HttpOnly` on
  auth cookies, anti-forgery tokens on state-changing routes (cookies can't tell your front end from
  a page that looks like it, and CORS never governed simple form posts), and a preflight surface
  trimmed to the methods you actually use.
- `app-security`: **SEC-16** — fetching a URL a user gave you. The moment your server, or an agent
  with your server's network position, fetches a user-supplied URL it becomes a proxy sitting
  *inside* your perimeter, able to reach internal databases, admin panels, and cloud metadata. The
  part people get wrong isn't the allowlist, it's that **validating once and fetching something else
  is the whole attack**: resolve, pin the validated address, connect to the pin, and re-check on
  every redirect. Then return one generic error — connection-refused says a host exists, a timeout
  says something is listening, and an attacker maps your network by reading the differences.
- `app-security`: SEC-06 gains the supply-chain detail. Check the package name character by
  character (a typosquat with a plausible download count is the cheapest way in, and a generator
  will suggest a plausible name without verifying it exists); triage on signals rather than CVEs
  alone — very low downloads, a recent maintainer handover, install scripts that execute on
  `npm install`; stop handing every package the whole `process.env`; and verify lockfile integrity in
  CI so an upstream-altered dependency blocks the deploy.
- `agent-operations` (1.2.0): AI-11's egress control now points at SEC-16 for the case that matters
  most — an agent fetching user-supplied URLs is a proxy through your own firewall, so the
  boundary belongs in the tooling, not in the prompt.

## 4.10.0

**Proving who sent the request**, and what happens when the browser stops protecting you.

- `api-design` (2.11.0): **APID-12** — sign the mutating calls. Session auth answers "is this a
  logged-in user"; it doesn't answer "did this exact payload arrive unmodified from a client I
  trust". For server-to-server and partner traffic there's no cookie and no user to challenge, so an
  endpoint that accepts a well-formed body and returns `200` is a front door with no lock. HMAC over
  the **raw bytes** (re-serializing the parsed JSON first is the classic bug that lets tampered
  payloads through), timestamp and nonce inside the signed material so a signature isn't replayable
  forever, constant-time comparison, one key per consumer. APID-07 also gains deprecation
  *telemetry*: count calls to the retiring version per consumer so removal is backed by a number
  rather than a hopeful date. **Global mirror synced.**
- `frontend-mobile-quality` (2.2.0): **FE-09** — harden the native shell. Wrapping a web app in a
  native container moves your whole client-side architecture onto a device you don't control:
  everything the browser sandboxed now sits in the app's data directory. Credentials go to
  Keychain/Keystore rather than web local storage — and an API key on the device is a published key
  wherever it's stored, so anything that must stay secret belongs on your server. Pin certificates
  (with a backup pin and a kill switch, because a pinned app whose cert rotated is a bricked app),
  and validate deep links before acting on them, since a malicious app can register your scheme and
  intercept auth callbacks.
- `monetization-pricing` (2.3.0): PAY-02's section now covers the layer *around* the signature — an
  unguessable endpoint path and provider IP allowlisting, explicitly as noise reduction on top of
  verification rather than a substitute for it.
- `compliance-legal` (2.3.0): LEGAL-12 gains the re-verification rule — a BAA covers named services,
  not the vendor, so a renamed or superseded service can silently fall outside coverage. "Same
  vendor" is not "still covered"; re-check on a schedule and before any migration moves data.
- `cost-infrastructure` (2.4.0): COST-07 gains the quiet deprecation — the signal is rarely a
  shutdown notice, it's a service moved to "legacy" that still runs and stops getting features.
  Track it as dated debt; the abstraction boundary is what keeps that plan cheap.

## 4.9.0

**The cost of saying yes**, plus the half of onboarding that happens after the first session.

- `cost-infrastructure` (2.3.0): **COST-08** — price custom work before you agree to it. Eighteen
  months of saying yes ends with a product that can't ship without regression-testing eleven bespoke
  features first; every yes felt like retention and collectively they took the roadmap hostage. Cost
  it fully — build time is the small part next to expanded test surface, maintenance *per release
  forever*, and what the team isn't building meanwhile — and if annual maintenance exceeds that
  client's contract value you now have the number to re-scope with. Express it as configuration
  where you can, and **productize at the third request**: three clients asking the same thing means
  it stopped being custom.
- `data-architecture` (2.2.0): **DATA-11** — keep one tenant's shape out of everyone's schema.
  DATA-10 stopped you forking the code; this stops you forking the data model. A custom column added
  to a shared table rides along in every query, index, migration, backup, and restore for the
  clients who never asked for it. Custom attributes belong in a tenant-scoped extension layer,
  heavy per-tenant workloads on scoped workers, and migration paths split so no single tenant's
  evolution forces a system-wide deployment.
- `growth-activation` (1.2.0): **GROW-10** — onboarding doesn't end at the first session. A launch
  spike converts on the signup page and empties out within the week because nothing after account
  creation gave anyone a reason to return. Reveal complexity progressively as the user demonstrates
  readiness rather than showing everything on day one, and fire day-1/day-7 re-engagement that names
  the thing *they* built — "your project has three tasks due tomorrow" beats "we miss you", and only
  works because GROW-05 got them to build something. GROW-05 also gains the target in **seconds**:
  the core action done inside the first minute, via templates and seeded data rather than an empty
  state and a tutorial.
- `agent-operations` (1.1.0): AI-09 gains the sharpest version of the tool-surface argument —
  **don't wrap what already has a command line**. A CLI is already an interface the agent can call;
  putting a server in front adds schema negotiation, serialization, and a permission handshake to
  every call and often exposes fewer capabilities than the tool it wraps. Wrappers still earn their
  place (no CLI, auth negotiation, stateful workflows), but settle it by benchmarking latency and
  token cost on a real task — and re-check it, because the answer moves as models improve.

## 4.8.0

**Three things that break once the app grows past one of something** — one codebase, one database,
one uptime number — plus the edge rules nobody writes.

- `data-architecture` (2.2.0): **DATA-10** — serve every tenant from one codebase. The multi-tenant
  failure people plan for is data leakage; the one that actually happens is divergence. A client
  wants dark mode, another wants CSV instead of PDF, a third wants onboarding skipped, and a
  generator cheerfully forks the repository each time. Eleven clients later there are eleven
  products sharing a name and a security fix has to land eleven times. Per-tenant feature flags
  instead of branches, a base config with override layers so the base still reaches everyone, and
  tenant resolution middleware that injects context before any business logic runs.
- `scaling-performance` (2.2.0): **SCALE-08** — read-after-write consistency. Adding a replica
  quietly changes your correctness model: the write lands on the primary, the next read comes off a
  replica a few seconds behind, and the user sees their own change missing. They file a bug; the app
  isn't broken, it's telling them something that was true a moment ago. Pin a writer's reads to the
  primary for a short window, monitor replication lag with a threshold that reroutes automatically,
  and decide the cross-region write conflict strategy deliberately.
- `observability` (2.2.0): **OBS-15** — price the incident. "The API returned 500 for twelve minutes"
  says what happened and nothing about what it cost; an outage on the docs page and one on checkout
  are not the same event. Attach users affected, transactions failed, and revenue at risk to every
  incident, and derive severity from those numbers — it's what makes `production-readiness` PROD-06's
  risk-ordered queue possible at all. **OBS-11** also gains the two refinements that separate a real
  error budget from a number in a doc: budgets **per critical endpoint** rather than one global
  uptime figure (which averages checkout together with marketing pages — that's how a status page
  reads "operational" while payments fail), and alerting on **burn rate** rather than on breach.
- `app-security` (2.3.0): SEC-13 now spells out the edge rules that don't come with the default-on
  ruleset — per-IP rate limits on login/registration/reset **at the edge** where credential stuffing
  is rejected before you pay the compute, bot rules on pricing/checkout/docs, and attack-pattern
  rules for the OWASP classics. A default-on WAF is a wall with no gate.

## 4.7.0

**Four gates that exist on paper.** This batch is about the difference between having a control
configured and having it *enforced* — a pipeline that runs but can't block, a vendor bill that
starts before the market does, context re-sent on every call, and a failure with nothing to contain
it.

- `deployment-cicd` (2.1.0): **DEPLOY-12** — branch protection actually enforced on `main`. Having
  CI configured is not the same as having merges blocked: forty-seven files land in one commit, no
  pull request, no review, and at 6pm on a Friday the payment flow stops with no way to tell which
  file did it. Reject direct pushes for *everyone* including automation, require the checks to
  **pass** rather than merely run, require a review, and keep changes small enough to bisect — which
  is what makes DEPLOY-06's rollback usable instead of theoretical.
- `cost-infrastructure` (2.2.0): **COST-07** — don't buy production before the market earns it. The
  expensive version is months of a vendor's monthly minimum against zero transactions. Separate what
  you must *demonstrate* from what you must *operate* (sandbox the flow, demo the whole experience,
  sell before switching on the paid rail), negotiate — first offer isn't last, and most providers
  run startup programs they don't advertise — and keep every third party behind a boundary you can
  swap, which is the same seam REL-03's fallbacks need anyway.
- `llm-cost-control` (2.1.0): **LLM-07** — cache the *input*, not just the answer. LLM-01 caches
  responses to similar questions; this is the other half, and agents live on it. Shipping the same
  system prompt and project context on every call pays full input price for identical tokens every
  cycle. Structure prompts stable-part-first (caching keys on a prefix), watch cache-read tokens —
  near zero on a repeated-context workload is an architecture problem wearing a billing costume —
  and mind the TTLs. LLM-05's section now also breaks spend down by model, workflow, and token type
  on a weekly cadence, which is what tells you whether the fix is routing, caching, or output length.
- `reliability-recovery` (2.2.0): **REL-08** — contain the blast radius. REL-03 protects the *call*;
  this protects everything else while that call misbehaves. One hung webhook stacks up request
  threads, queues everything behind them, and takes authentication and checkout down with it.
  Bulkheads give each dependency its own bounded pool so a hang exhausts only its own compartment,
  and a **total request time budget** replaces per-call timeouts — five seconds spread across the
  chain, not five seconds each.

## 4.6.0

**Three boundaries that were configured but not enforced.** Each rule here covers a control people
believe they already have: an edge that traffic can route around, a role that can't tell a thief
from its owner, and a vector store that answers whoever asks.

- `app-security` (2.2.0): **SEC-14** — edge protection you can't walk around. A WAF only protects
  traffic that goes *through* it, so a discoverable origin IP makes every rule optional. Assume it
  leaked and go find it: DNS history keeps every address the domain ever resolved to, and stray
  subdomains, MX records, and outbound mail headers each publish it independently. Then firewall the
  origin to the CDN's ranges, and set TLS to full/strict with an origin certificate — "flexible"
  modes leave CDN→origin in plain text while the browser shows a padlock. Verify by requesting the
  site directly by IP; if it answers, the edge is decorative.
- `auth-access` (2.3.0): **AUTH-12** — when the role isn't enough. A stolen password yields a
  session identical to the real user's: same role, same permissions, 3am, unfamiliar country. Add
  attribute-based checks that weigh time, location, device, IP reputation and data sensitivity per
  request; re-verify identity on *internal* calls too, since generated services trust anything
  already inside the perimeter; and score sessions continuously for impossible travel, volume
  spikes, and escalation attempts. Graded to sit **after** AUTH-01..08 — this is tier three, not a
  substitute for working authorization.
- `ai-engineering` (3.1.0): **AI-12** — retrieval boundaries. Once a corpus holds anything not public
  to every user, the vector store is an access-control surface, and embedding everything into one
  pool means retrieval returns whatever is semantically closest regardless of who owns it. Tag
  ownership at embed time and filter inside the query; treat uploads as untrusted, because a
  document can carry instructions that execute whenever that chunk is retrieved — a stored injection
  sitting in your index; and re-check every cited source against the user's permissions before the
  answer ships, since ACLs change after embedding.
- `reliability-recovery` (2.1.0): REL-02 now names **RPO and RTO** explicitly and insists both come
  from what the business tolerates rather than from whatever the default backup schedule implies —
  a nightly snapshot *is* an RPO of up to 24 hours. Restore drills are timed, not estimated.

## 4.5.0

**Inspection before occupancy.** Every industry where people can be harmed puts a check between
*we built it* and *people use it* — a kitchen isn't served from until it's inspected, a building
isn't occupied without sign-off. Software is the exception: the foundation gets poured over a
weekend and the first paying customer moves in on Monday, with nobody having looked at the schema,
the auth flow, or the API boundary. A failed foundation in construction is torn out before anyone
steps inside; in software it fails silently while customers live on top of it.

- `production-readiness` (2.2.0): **PROD-08** — no customer reaches a build that hasn't passed a
  structured pre-release audit, with the pass/fail result recorded. The point isn't the score, it's
  that passing *and* failing are written down, so "we didn't know" stops being available: P1s block,
  P2s ship only as a written accepted risk with an owner and a date, and the record lives with the
  release. It doubles as most of what a buyer's security review asks for (LEGAL-09), and as
  disclosure obligations tighten (LEGAL-13/14/15) the builders already inspecting absorb each new
  requirement as a checklist line instead of a retrofit. Distinct from PROD-06, which orders work
  *after* you know what's broken — this is the gate that stops an uninspected build reaching anyone.
- `growth-activation` (1.1.0): GROW-01 gains the rehearsal phase. Starting the content track late
  isn't the only failure — the other is discovering on launch day that you don't know *how*, so the
  first attempt gets deleted and nothing ships. Practise somewhere with no stakes (throwaway
  account, unrelated topic, nobody you know watching); bad output and zero views are the point,
  because you're building the muscle, not an audience. Added the calendar the corpus keeps
  implying: ~200 days out learn the skill, ~100 days out build in public until launch day carries
  proof, ~100 days after revise against real behavior (GROW-09). The numbers aren't the claim — the
  granularity is. The app can be built in a weekend; the business moves in hundred-day blocks.

## 4.4.0

**New sub-skill: `agent-operations`**, split out of `ai-engineering` — agents crossed the threshold
where they're their own discipline. A model that *answers* and a model that *acts* fail differently:
the second accumulates state, chooses tools, runs unattended, and can reach things that matter.
Pack: 22 → 23 skills.

**No rule IDs changed.** `agent-operations` owns AI-05, AI-06, and AI-08..11 exactly as they were
published; `ai-engineering` keeps AI-02..04 and AI-07 and carries a delegation row — the same
pattern as SEC-01..03 in `secrets-management`. Existing citations stay valid.

Three new rules land with the split:
- **AI-09 — budget the tool surface.** Every connected tool is evaluated on *every* request, so ten
  permanently-loaded connectors are ten things competing for a finite context window before the
  agent starts on the actual task, plus a failure mode where it picks a plausible wrong tool. Load
  per task, not per project; when a model can read the API docs and make the call itself, a
  permanent wrapper often costs more than it saves. Keep wrappers that earn it — fiddly auth,
  stateful protocols, a boundary you want enforced in one reviewed place. Quality degrading as a
  project accumulates integrations is usually clutter, not a worse model.
- **AI-10 — configuration is perishable.** Instruction files, skill definitions, prompt scaffolding,
  and connectors are all still being consulted months later. Stale instructions compete with current
  ones and the conflict reads as the model getting worse; workarounds for limitations that no longer
  exist are brakes. Review the stack on a cadence (a quarter is a reasonable default) and date your
  config so the next review is a decision, not an excavation.
- **AI-11 — boundaries belong in the tooling, not the reviewer.** The expensive agent failures share
  a shape: the agent did something destructive and a human approved it. Nobody catches every
  dangerous action by reading hundreds a day — that's a bottleneck without teeth. Scoped short-lived
  credentials, an egress allowlist, deny-by-default gates on destructive operations, and an
  append-only tool-call log. Then the approvals a human *does* see are the few that need judgment.

- `app-security`: SEC-10 gains the corollary — a successful prompt injection is only as dangerous as
  what the agent can reach, so the AI-11 boundaries turn one into a rejected tool call.
- `audit`: new matrix row routing to `agent-operations`; namespace table notes the AI- split.

## 4.3.0

**New skill: `growth-activation`** (GROW-01..09) — the half of shipping that isn't engineering the
product. The pack could take an app through all thirteen production layers and still leave it
launching to silence; this closes that gap. Pack: 21 → 22 skills.

It covers the arc end to end:
- **Before launch** — build the audience on the same clock as the product (GROW-01), because every
  week spent building without publishing is a week your future customers don't know you exist; and
  scope from what target customers **already use and pay for** (GROW-02) rather than from what's
  easy to generate. Sit with a real operator, count the features they actually touch across the ten
  platforms they pay for, and build that subset.
- **At the point of sale** — instrument every step from discovery to purchase with entries,
  drop-offs, and conversions (GROW-03), and version and A/B test the funnel the way you test
  features, treating checkout abandonment as seriously as API latency (GROW-04). You'd never run the
  app without error tracking.
- **After signup** — the activation window: one named core action completed in the first session,
  with a nudge when it isn't (GROW-05); the week-three habit gate, alerting on a drop below *that
  user's* own baseline rather than a global threshold (GROW-06).
- **Reading the truth** — cohort retention instead of total-user counts, which only ever go up
  (GROW-07), and feature adoption diagnosed as a discovery problem before anything is rebuilt
  (GROW-08).
- **At ~100 days** — the launch build was a hypothesis; schedule the review and pivot on behavior
  data (GROW-09).

- `audit`: new matrix row routing to `growth-activation`; `GROW-` added to the rule-ID namespace
  table and the router's description.

## 4.2.0

**Fourteen lessons folded in — eight new rules.** The theme of this batch is the layers nobody
audits: what sits *in front of* the database, what sits *in front of* the app, what the law now
requires of generated content, and what a build actually costs to run.

- `compliance-legal` (2.2.0): **LEGAL-14** — AI transparency. Products shipping model-generated
  content owe users a visible, non-removable disclosure (watermark / disclaimer / metadata tag), an
  affirmative opt-in before their input reaches a model, and an immutable generation log recording
  every output with its timestamp, model, and triggering input. The EU AI Act's transparency duties
  are the furthest along and are live now; the generator has never read a statute.
  **LEGAL-15** — your obligations are scoped by where your *users* are, not where you are: one
  subscriber in a covered market pulls you in, geo-fencing and ToS exclusions don't hold, and the
  real map comes from payment country and billing address.
- `app-security` (2.1.0): **SEC-13** — edge protection. A WAF in front of the whole stack (not
  per-endpoint limits), rate limiting that adapts to attack *behavior* rather than just volume, and
  a DDoS runbook written before the outage. **SEC-11** expanded: split error handling into a public
  layer and a private one, catch at every boundary (API routes, background jobs, webhook receivers,
  payment callbacks — not just the login form), and give the private half a searchable pipeline.
- `secrets-management` (2.1.0): **SEC-12** — block secrets at commit time with a pre-commit hook
  plus platform push protection. Roughly seven in ten audited projects have a live credential in
  their repository; rotating without adding the hook just schedules the next cleanup.
- `auth-access` (2.2.0): **AUTH-11** — row-level security is bypassed by everything that answers
  before the database does. Scope every cache key to the tenant, then sweep the layers people
  forget — search indexes, job queues, file paths, logs, rate-limit stores — and pin it with a
  cross-tenant test in CI.
- `data-architecture` (2.1.0): **DATA-09** — changing a live schema. Expand then contract (add,
  backfill, dual-write, cut over, drop in a later release), write the rollback before the migration,
  and rehearse on a staging mirror with current data shapes.
- `ai-engineering` (2.1.0): **AI-08** — agents that contradict themselves at step 15 ran out of
  context, not competence. A state document that travels with the task, decomposition into
  five-to-seven step chunks each in a fresh session, and a human checkpoint between chunks.
- `cost-infrastructure` (2.1.0): **COST-06** — unit economics. Cost attributed per *feature*, not
  per month; revenue per user against cost per user (a heavy user who costs more than they pay is a
  liability that grows as you succeed); and a monthly P&L reconciled automatically from the payment
  processor and hosting dashboards.
- `monetization-pricing` (2.2.0): **PAY-13** — when the buyer is an agent. Machine-readable product
  data, packaging that installs without a human, and metered pricing an agent can actually
  transact — a per-seat monthly plan is unbuyable by a consumer that shows up for one call.
- `scaling-performance` (2.1.0): SCALE-04 gains the ownership question — a cache stores the result
  *after* security ran for the first requester.
- `api-design` (2.10.0): APID-10 extended for the install-not-browse path — docs as the sales
  surface, self-serve credentials, metered pricing. (Global mirror synced.)

## 4.1.0

**Accessibility gets teeth.** `frontend-mobile-quality` had one generic a11y line; it now carries
three checkable rules and an hour-long audit procedure, and the legal side is named for what it is.

- `frontend-mobile-quality` (2.1.0): **FE-07** (every core flow completable by keyboard alone —
  reachable controls, visible focus, modals that trap and restore focus) and **FE-08** (text contrast
  meets WCAG AA: 4.5:1 body, 3:1 large text and UI boundaries) added. **FE-02** sharpened from
  "accessible" to the concrete screen-reader contract: alt text on every image, an accessible name on
  every icon-only control, ARIA on inputs and landmarks, sane focus order. New How-It-Works step with
  the three-audit procedure, a fix playbook block (including pinning the floor with axe-core in CI),
  and a worked example.
- `compliance-legal` (2.1.0): **LEGAL-13** — accessibility conformance documented: WCAG 2.1 AA named
  as the target, a dated audit kept, an accessibility statement published (target, known gaps,
  timeline, contact route), remediation logged. P1 for government, education, healthcare, and
  public-accommodation sectors. Digital products are treated as places of public accommodation in
  most jurisdictions, and a documented plan with open items is a far better posture than silence.
- `production-readiness` (2.1.0): **PROD-07** — feature health audit before the next feature. Every
  shipped feature scored *works / broken / adopted*: broken-and-used gets fixed first,
  broken-and-unused gets deleted, works-and-unused gets investigated. Building on a broken layer
  multiplies fragility, and the support inbox asks for the existing features to work — not for more.
- `monetization-pricing` (2.1.0): **PAY-12** — ICP and positioning written down from real research
  before building: the ICP derived from your actual background rather than a market that merely
  sounds profitable, community research done from the inside, and a positioning document (who you
  serve, what you deliver, how you differ, where you compete) that feeds the landing page, the
  one-sentence sale, and the pricing tiers.

## 4.0.0

**Back to MIT.** The project is MIT licensed again (v3.0.0–v3.5.0 were CC BY-NC-SA 4.0), and the
v3.x content is re-released under MIT too, so the whole history is usable under one permissive
license. Per-skill footers updated; `plugin.json` license set to `MIT`.

**New skill: `test-quality`** (TEST-01..09) — judges a suite on whether it would *catch* a bug, not
on coverage percentage: anti-fragility (no error-substring assertions, no private-symbol access, no
tautological readbacks, no expectations recomputed with the logic under test), rigor (fixed vectors,
boundaries, error paths), mocking discipline (never mock the unit under test), reuse
(parametrization), correctness (verify real library behavior), and coverage as a floor rather than a
target — with mutation survival as the real measure. Pack: 20 → 21 skills.

Rubric adapted with credit from [beyond-test-coverage](https://github.com/rollinsio/beyond-test-coverage)
by Michael Rollins (MIT). Added a Credits section to the README.

- `audit`: new matrix row routing suites to `test-quality`; `TEST-` added to the rule-ID namespace.

## 3.5.0

Nine lessons folded in (a backlog batch):
- `production-readiness`: new **PROD-06** — break the endless-debugging loop by auditing the whole
  stack first, then queueing work by **business risk** (money / data / legal), not by whatever broke
  most recently.
- `app-security`: new **SEC-11** — production errors return generic messages; stack traces and
  internals stay in server-side logs. Input validation extended to *every* endpoint, not just forms.
- `observability`: new **OBS-14** — audit trail on sensitive actions (plan changes, email changes,
  deletions, permission edits): the generator built the actions but never the receipts.
- `frontend-mobile-quality`: new **FE-06** — build for where customers actually are: locale-aware
  formatting and per-user timezone for scheduled messages.
- `monetization-pricing`: new **PAY-11** — multi-currency checkout (processors support scores of
  currencies; the default is one).
- `cost-infrastructure`: new **COST-05** — document your **customer ceiling**: the bundled stack is
  right for the first ~10 customers, enterprise procurement is several evolutions away, and knowing
  the line closes deals.
- `api-design`: APID-10 extended — agents as customers: publish machine-readable product data,
  expose the criteria agents filter on, and check how assistants actually describe you.
  (Global mirror synced.)
- `deployment-cicd`: DEPLOY-01 — the shared dev/prod failure mode spelled out (one database, one
  key set, test accounts beside paying customers).

## 3.4.0

Three new lessons folded in:
- `reliability-recovery`: new **REL-07** — incident communication: a status page on *separate*
  infrastructure (hosted on your own stack it goes down with you), maintenance announced in advance,
  and an incident-comms workflow prepared before the outage. Silence turns a technical problem into
  a trust problem.
- `auth-access`: AUTH-10 expanded to audit the **provider**, not just the integration — can it do
  SAML/SSO at all, can it produce its own compliance documentation for the buyer's vendor audit, and
  what does migrating off it cost before you're locked in.
- `compliance-legal`: new **LEGAL-12** — health data (HIPAA/PHI): encryption everywhere it lands
  including **logs, backups, and exports**, per-record access audit trails (role-based access alone
  isn't enough), and a BAA with every third party that can see it.

## 3.3.0

Three new lessons folded in:
- `auth-access`: AUTH-04 expanded into full **session management** — pick a session lifetime from
  data sensitivity (hours for financial data, days for low-risk content) instead of the framework's
  forever-default, cap concurrent sessions per user, and revoke every session instantly on a
  credential change (otherwise a password reset is a false sense of security).
- `monetization-pricing`: new **PAY-10** — transactional email deliverability: SPF/DKIM on the
  sending domain, transactional sending split from marketing, and inbox-placement monitoring
  (a "delivered" log line only means a mail server accepted it). A missing receipt reads as fraud
  and returns as a chargeback.
- `compliance-legal`: new **LEGAL-11** — sales tax / VAT: map economic-nexus exposure by
  jurisdiction, enable tax collection at checkout (built into the processor but off by default),
  and keep a remittance calendar — collecting without remitting is a liability.

## 3.2.0

Three new lessons folded in:
- `monetization-pricing`: new **PAY-08** — dispute defense before the first chargeback (published
  refund policy, chargeback-rate alerts, a prepared response workflow; a dispute can freeze the whole
  processor balance); new **PAY-09** — dunning (staggered retries, failed-payment email sequence,
  grace period before cancel; recovers 30–40% of failed charges).
- `compliance-legal`: new **LEGAL-10** — retention obligations, the flip side of deletion: some
  records are legally required to be kept (regulated sectors, up to ~7 years), so separate
  user-controlled data from law-required records, map a schedule to your obligations, and keep an
  audit trail.

## 3.1.0

- New skill: **`solidity-security`** (SOL-01..10) — a smart-contract / EVM audit covering the
  vulnerability classes that recur in competitive audit findings: reentrancy (incl. cross-function),
  access control (tx.origin trap), oracle manipulation (spot vs TWAP, Chainlink staleness),
  arithmetic precision, unchecked return values (SafeERC20), flash-loan surface, MEV/front-running,
  signature replay (EIP-712), proxy safety (EIP-1967), and dangerous token integrations
  (fee-on-transfer, rebase, pausable, ERC-777). Self-contained, no external calls; fix playbook with
  paste-able Solidity. Community contribution via PR #2. Pack: 19 → 20 skills.
- `audit`: new matrix row routing smart-contract concerns to `solidity-security`; `SOL-` added to
  the rule-ID namespace table.

## 3.0.0

**License change (the reason for the major bump):**
- Relicensed from MIT to **CC BY-NC-SA 4.0**: visible attribution to hossein-webdev required,
  no commercial use, derivatives must carry the same license. Versions prior to v3.0.0 remain
  available under MIT for those versions only.
- Every SKILL.md now carries an attribution/license footer (skills travel as single files; the
  notice travels with them).
- `plugin.json` license updated to `CC-BY-NC-SA-4.0`; README badge + license section updated.

No content/rule changes in this release.

## 2.9.0

Three new lessons folded in:
- `api-design`: new **APID-11** — return only what the client needs: opaque identifiers instead of
  sequential/internal IDs (enumeration via incrementing is one API call away), explicit response
  shapes instead of `SELECT *`-to-JSON, and the API as the first impression technical buyers judge.
  (Global mirror synced.)
- `deployment-cicd`: DEPLOY-01 tightened — staging only counts if it mirrors production (schema,
  services, env vars), with tests gating automatic promotion.
- `cost-infrastructure`: serverless vs containers as a maturity decision — the convenience-premium
  vs ops-burden gap analysis, and the hybrid answer (serverless request/response, containers for
  background work, dedicated for scheduled jobs).

## 2.8.0

Three new lessons folded in:
- `compliance-legal`: new **LEGAL-09** — security-questionnaire readiness: answers prepared before
  the questionnaire arrives (encryption, scan cadence, pen-test date, IR plan, data residency), the
  audit → fix → pen test → re-audit pipeline, and a public security page that answers half the
  questionnaire for free.
- `app-security`: SEC-09 ordering — audit first, pen test second (attacking known-broken
  infrastructure wastes the engagement); the two artifacts double as procurement evidence.
- `reliability-recovery`: new **REL-06** — post-mortem discipline: five-field template before the
  first incident, the blameless 48-hour rule, and an incident library so the same root cause never
  causes the same outage twice.
- `production-readiness`: PROD-05 extended with the **70/30 split** — playbooks auto-resolve ~70%;
  the human 30% (customer-is-right disputes, feature-requests-as-bugs, the email that isn't about
  the stated issue) is where trust is earned.

## 2.7.0

Five new lessons folded in:
- `api-design`: new **APID-10** — design for machine consumers: structured, self-describing
  responses and MCP exposure; AI assistants integrate MCP-speaking services in minutes and route
  around the rest. Discoverability is now a distribution channel. (Global mirror synced.)
- `compliance-legal`: new **LEGAL-08** — the pre-revenue document set (ToS, privacy policy, DPA,
  refund policy, MSA + insurance backstop); LEGAL-03 rebuilt as a process — cascade map first,
  soft-delete with a ~30-day retention window then automatic hard delete, and a
  full data report producible on demand within the regulatory window.
- `data-architecture`: new **DATA-08** — keep downstream systems in agreement via change data
  capture: real-time events instead of polling, routed by type, with dead-letter handling.
- `observability`: new **OBS-13** — the support inbox as a monitoring tool: root-cause triage
  (3× same cause = engineering bug), the three buckets (UX / observability gap / wrong design),
  and the weekly 30-minute review.

## 2.6.0

Five new lessons folded in:
- `auth-access`: new AUTH-10 — enterprise SSO as a procurement gate: SAML 2.0/OIDC done properly
  (handshake, assertions, attribute mapping, sessions) and multi-tenant SSO with per-tenant IdP
  configuration, built before the IT checklist arrives.
- `app-security`: SEC-07 expanded — CSP script-source lockdown: audit every external resource,
  run report-only for a week, then enforce a whitelist (a dozen unapproved script domains is an
  attack surface, not a feature).
- `deployment-cicd`: new DEPLOY-11 — runbooks per failure scenario + automated metric-driven
  rollback; release section reframed around decoupling deploy (technical) from release (business)
  — the "any day is deploy day" architecture.
- `monetization-pricing`: PAY-06 expanded — price against the quantified pain (not what feels
  fair), the one-sentence sale (pain → resolution), and finding first customers where the
  complaints live.
- `database-selection`: new DBS-05 — migration timing by math: the 10×-with-optimization test, the
  architecturally-impossible test, and workaround-cost vs migration-cost.

## 2.5.0

Four new lessons folded in:
- `auth-access`: full **token lifecycle** added to AUTH-04 — silent background refresh before the
  ~60-min expiry, state-preserving reauth on refresh failure, refresh-token rotation on every use;
  AUTH-08 extended with **tenant-breach anatomy** — cache keys must include tenant context, and
  cross-tenant reads must alert the moment they happen (you must answer "how long / who else"
  immediately).
- `production-readiness`: new **PROD-05** — the support system ships with the product: per-feature
  support playbooks (same sprint), real-time production signals, and T1/T2/T3 tiers defined before
  the first customer. The support gap kills more launches than bad code.
- `api-architecture`: API-02 expanded — trust nothing at the boundary: schema-validate every route
  (reject/strip), sanitize every string, middleware rate-pattern awareness (50 req/s = probing).

## 2.4.0

Four new lessons folded in:
- `compliance-legal`: new LEGAL-06 — cyber liability insurance once you hold others' data
  (~$200–600/yr vs a five-figure breach; underwriters require security basics, making the security
  audit an insurance prerequisite); new LEGAL-07 — platform ToS liability caps (provider exposure =
  your last invoice); LEGAL-01 extended — the privacy policy must match what the app actually does.
- `observability`: new OBS-12 — session replays wired to error events + rage-click detection
  ("watch what happened instead of asking"); intro reframed around the **discovery gap** (60s vs 6h
  = the day's revenue + trust cost).
- `scaling-performance`: SCALE-05 extended with the respond-then-queue pattern — confirm the moment
  the core action succeeds, queue the rest with independent retries, and monitor the queue (silent
  queue failures are worse than request failures).

## 2.3.0

Five new lessons folded in:
- `reliability-recovery`: REL-02 expanded into the three backup decisions — frequency
  (point-in-time recovery is a setting, turn it on; daily = accepting 24h of loss), location
  (same-server backup = the same risk twice; go cross-region/off-site), and monthly restore drills.
- `deployment-cicd`: new DEPLOY-10 — the CI free-tier quota trapdoor (minutes die mid-sprint,
  overage turns free into four figures): usage alert at ~75%, path-based conditional pipelines,
  self-hosted runners as the escape hatch.
- `app-security`: SEC-10 expanded — assistant-context prompt injection is proven (critical RCE via a
  poisoned PR description); everything an AI assistant reads (repo, comments, issues, PRs) is an
  injection surface.
- `scaling-performance`: SCALE-04 expanded — caching as a business decision: staleness budget per
  data class (pricing/permissions/inventory/account status: never stale), event-driven invalidation
  over TTL timers, expiry-stampede protection.
- `production-readiness`: vulnerability stat refreshed to 2–3× (latest measurement ~2.7×).

## 2.2.0

- New skill: **`api-design`** (APID-01..09) — the API surface itself: resource naming, semantic
  status codes (never 200 for failures — ties into PAY-04 for webhooks), one standard error shape,
  cursor/offset pagination, filtering/sorting conventions, rate-limit headers, versioning +
  deprecation policy (Sunset, max 2 live versions), idempotency keys, request-id echoing.
  Child of `api-architecture` (which keeps the boundary/architecture side). Pack: 18 → 19 skills.
- `audit`: new matrix row routing API-surface concerns to `api-design`.

## 2.1.0

Four new lessons folded in:
- `observability`: "monitoring that isn't theater" — outside-in health checks from multiple regions
  (OBS-09), logs+metrics+traces correlated via OpenTelemetry with a <60s trace target (OBS-10), and
  SLOs with error budgets that gate release pace (OBS-11), incl. the uptime math (99% = 3d15h/yr).
- `api-architecture`: 3-layer rate limiting as architecture (API-06) — hard limits (safety net),
  adaptive limits (token bucket/sliding window under load), tiered limits as the pricing model.
- `monetization-pricing`: tiered rate limits as pricing architecture (free tier proves value,
  restriction creates the upgrade).
- `reliability-recovery`: REL-05 — the generator never raises backup strategy on its own; the
  default AI-built app is one DB/one region/no schedule/no retention/no tested restore.
- `deployment-cicd`: DEPLOY-08 expanded with concrete platform ceilings — concurrency caps,
  execution-time limits, bandwidth caps, silent function-size deploy failures.

## 2.0.0

**Linter-grade audit.**
- Stable **rule IDs** across the pack (SEC-, AUTH-, SCALE-, DATA-, DBS-, AI-, LLM-, OBS-, DEPLOY-,
  REL-, LEGAL-, API-, FE-, COST-, PAY-, PROD-) — every rule defined once in its owning skill with a
  `## Rules` table and severity-if-failed.
- **Readiness score** (/100; P1 −25 · P2 −10 · Verify −3 · Light −1) with Solid/Risky/Ship-blocker bands.
- **Finding cards**: every gap now reports Where/What/Why-it-matters/time-boxed Fix commands/Verify
  step/Routes-to, with Confirmed/Likely/Verify confidence. Spec in `skills/audit/reference.md`.
- **Static pre-scanner** `skills/audit/scripts/scan.mjs` (Node ≥18, zero deps, read-only): env
  tracking, secret patterns, dependency classes (db/auth/ai/payments/queue/mobile/observability),
  routes/workers/CI/tests/migrations, RLS + header mentions. Scanner reports facts; the audit
  verifies before carding.
- **Deep aspect detection + adaptive rules** (reference.md): serverless, monorepo (per-app audits),
  hand-rolled auth strict mode, client-side AI call = auto-P1, SPA bundle rules, maturity calibration.
- **Re-audit drift**: reports saved as `vibe-check-report.md`; re-runs diff fixed/new/remaining + score delta.

**Three new sub-skills** (pack: 15 → 18): `secrets-management` (from app-security),
`database-selection` (from data-architecture), `llm-cost-control` (from ai-engineering) — parents
slimmed and route to them.

**Content + structure.**
- `production-readiness`: the 2-of-13-layers framing, the ~2× vulnerability stat, concrete scale
  tiers (1k/10k/100k users).
- `app-security`: monoculture risk (template-cloned apps share exploitable flaws) + a 30-minute
  3-check starter before the full list.
- Every domain skill: `## Rules` table + `## Fix playbook` with real commands + `metadata.version`.
- Checklist format for `compliance-legal` and the monetization webhook path; observability/scaling
  sections restructured into single flows.

## 1.2.0

- `scaling-performance`: added the ordered scaling decision tree — diagnose connections → queries →
  reads/writes before spending on bigger infra (a pooler beats a replica; the frequent query beats the
  slow one; replicas only help reads).
- `data-architecture`: DB choice is now workload-driven (read/write ratio, schema-change-under-traffic
  branching, lock-in vs portability) and includes edge/SQLite (Cloudflare D1) alongside Neon/PlanetScale.
- `observability`: new "catch the failures your code doesn't know about" section — business-metric
  alerting, synthetic transactions, and dead-letter queues for webhooks.
- `monetization-pricing`: added the silent-revenue-loss trap — never return `2xx` for a failed charge
  (the provider won't retry and error trackers can't see it).
- `app-security`: added AI/prompt supply-chain trust tiers (first-party / vetted / unvetted) and
  prompt-injection mitigations (isolation, review, rotation).

## 1.1.0

- `audit` is now evidence-based and ends with a **required prioritized gap table** (one row per area,
  "what you're missing", priority, and a cited `file:line` for every non-green row).
- Added a grading rubric: 🟢 Solid · 🔴 Gap (P1) · 🟠 Gap (P2) · 🔎 Verify · 🟡 Light (P3) · ⚪ N/A,
  with priority defined by blast radius (data/money/auth/data-loss = P1).
- Accuracy guards: profile from code first, mark N/A loudly, grade mature apps green, downgrade
  unverifiable claims to "Verify" instead of asserting a gap, and avoid architecture-irrelevant flags.

## 1.0.0

- Initial release: 15 skills.
- `audit` — adaptive production-readiness audit that profiles the app and routes to focused skills.
- Domain skills: `production-readiness`, `app-security`, `auth-access`, `scaling-performance`,
  `data-architecture`, `ai-engineering`, `observability`, `deployment-cicd`, `reliability-recovery`,
  `compliance-legal`, `api-architecture`, `frontend-mobile-quality`, `cost-infrastructure`,
  `monetization-pricing`.
- Packaged as a Claude Code plugin with a single-plugin marketplace.
