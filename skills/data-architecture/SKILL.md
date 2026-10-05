---
name: data-architecture
description: >
  Designs the data layer so it survives growth: a real schema instead of one giant table,
  multi-tenancy decided up front, versioned migrations and tested backups, files in object storage
  behind a CDN, ORM choice (Prisma vs Drizzle), and conflict handling for collaborative data
  (CRDTs). For choosing the database platform itself (Supabase/Firebase/Convex/Neon/PlanetScale/D1),
  routes to the database-selection skill. Activates when the user mentions database design, schema,
  normalization, multi-tenant, tenant id, migrations, backups, storing images/files, ORM choice, or
  real-time conflicts. Applies only to apps that use a database.
user-invokable: true
metadata:
  category: data-architecture
  version: "2.3.0"
---

# Database & Data Architecture

"AI doesn't design a database — it creates tables." The result is one sprawling table with dozens of
columns doing the job of several related ones. Data decisions (schema, tenancy, storage, migrations)
are structural: cheap to get right early, brutal to change once real users and data depend on them.

Which platform to run → `database-selection` (owns DBS-01..04).

Freedom: **medium** — recommend the pattern, adapt to the stack.

## Rules

| ID | Check | If it fails |
|---|---|---|
| DATA-01 | Schema models entities/relations (no catch-all mega-table) | P2 |
| DATA-02 | Multi-tenancy decided up front (`tenant_id` everywhere + RLS) when multiple customers share | P1 if B2B |
| DATA-03 | Files/blobs in object storage + CDN, not database rows — and the bucket is private, served through signed URLs, with unguessable keys | P2 for the placement, **P1 for the permissions** |
| DATA-04 | Versioned migrations exist; no schema edits directly in production | P1 |
| DATA-05 | Backups exist (restore testing → reliability-recovery REL-02) | P1 |
| DATA-06 | Platform fits the workload | → `database-selection` (DBS-01..04) |
| DATA-07 | Concurrent-write conflict strategy chosen (CRDTs where merging must be automatic) | P2 if collaborative |
| DATA-08 | Downstream consumers synced via change data capture (events, routed by type, with a DLQ) — not polling | P3 (P2 with search/analytics/notifications) |
| DATA-09 | Live schema changes are expand-then-contract, with a rollback script written up front and a rehearsal on a current staging mirror | P1 once the database has real users |
| DATA-10 | Per-tenant differences live in configuration, not in forked code: tenant-scoped flags, base config with overrides, tenant resolved at the boundary | P1 if B2B with per-client customization |
| DATA-11 | Tenant-specific changes stay out of the shared core: custom fields in an extension layer, heavy tenant workloads on scoped workers, migrations split core vs per-tenant | P1 if B2B with per-client data shapes |

## When to Use This Skill

- User mentions database design, schema, normalization, or "one big table".
- User mentions multi-tenant, tenant id, or separating customers' data.
- User mentions migrations, backups, or schema changes in production.
- User needs to add, rename, or restructure a column/table on a database that already has users.
- User is choosing an ORM (Prisma/Drizzle) or storing images/files.
- Uploads are served from a storage bucket, or a bucket's permissions have never been checked.
- (Which platform/provider → `database-selection`.)

## How It Works

1. **Model the data (DATA-01).** Break the catch-all table into normalized, related tables that
   reflect real entities. A designed schema survives features the generator never saw coming.
2. **Decide tenancy before scale (DATA-02).** Proven pattern: one database, **`tenant_id` on every
   table**, enforced by **row-level security** (see `app-security` SEC-04). Retrofitting isolation
   after launch is the expensive road.
3. **Blobs out of the database (DATA-03).** Images/files go to **object storage**, served via
   **CDN**; rows hold references. Cheaper, faster, and backups stay small. **Then get the permissions
   right, because this rule is what put your users' files there:**
   - **The bucket is private.** A generator sets it public because that is the fastest way to make an
     upload render in the browser, and the result is every file one URL away from anyone {EM} contracts,
     identity documents, medical scans, exports. Some providers also make the *listing* public, which
     turns one bucket into a downloadable index of everything you hold.
   - **Serve through short-lived signed URLs** generated per request after your own authorization check
     (→ `auth-access` AUTH-05), not a permanent public link. Expire them in minutes; they get
     pasted into chats, cached by proxies, and logged.
   - **Make object keys unguessable.** Sequential or predictable names (`uploads/invoice-1041.pdf`,
     `avatars/<sequential-user-id>.jpg`) let someone walk the namespace even without listing permission
     — the same enumeration problem as sequential ids in `api-design` APID-11. Use random keys and
     keep the real filename in a database column.
   - **Validate what you accept**: content type and size limits server-side, no user-controlled path
     segments in the key (path traversal via filename), and no serving user uploads from your own
     origin where an HTML or SVG file would execute as your site.
   - **Check it from outside**, signed out and from another network: fetch a known object URL directly
     and attempt to list the bucket. Both must be refused. This takes a minute and is the only way to
     know, since the console often shows the intent rather than the effective policy.
4. **Migrations + backups, non-negotiable (DATA-04/05).** Versioned migrations for every schema
   change; scheduled backups whose restores get *tested* (→ `reliability-recovery`). Editing schema
   live in prod is a slow-motion outage.
5. **ORM by posture.** **Prisma**: schema-driven, type-safe guardrails. **Drizzle**: lighter,
   closer to SQL, more control. Either beats raw string queries from a generator.
6. **Concurrent writes (DATA-07).** "Last write wins" silently drops data in collaborative docs —
   pick a conflict strategy up front; use **CRDTs** where merging must be automatic.
7. **Keep downstream systems in agreement (DATA-08).** The database changed; the search index shows
   the old name, analytics shows yesterday, the alert never fired — three dependent systems and
   none of them heard. The pattern:
   - **Change data capture** — every insert/update/delete fires an event in real time; no polling,
     no five-minute cron;
   - **route events by type** — search gets product updates, not login events; each consumer
     receives only what it needs;
   - **dead-letter failed events** — a missed event means a system believes nothing changed when
     everything did; capture, retry, alert (→ `observability` OBS-08).
   The database is the source of truth; CDC is how everything else agrees with it.
8. **Change a live schema without an outage (DATA-09).** Having migrations (DATA-04) is not the same
   as being able to *run* one against traffic. A generator's instinct is to drop the column and
   recreate it — and every customer query touching that column mid-migration either errors or
   returns nonsense. Three requirements, every time:
   - **Add before you remove (expand → contract).** New column goes up; data backfills across; the
     application starts writing and reading the new one; the old column drops only after that switch
     is confirmed in production. Renames are the same shape: add, dual-write, backfill, cut over,
     drop. That sequence is the whole difference between a migration and an outage.
   - **Write the rollback before you run the migration.** Not after it breaks. If the change can't
     be described in reverse, it isn't ready — that's the test, and it catches destructive steps
     before they run.
   - **Rehearse on a current staging mirror.** Not production, not a copy from three weeks ago — a
     mirror with today's data shapes and roughly today's volume, so you find the lock that takes
     four minutes on 2M rows *there*. The first run of a migration should never be against the
     database your customers depend on.
   Long backfills belong in batches with a bounded lock window; add the index concurrently where the
   engine supports it.

9. **Serve every tenant from one codebase (DATA-10).** The other multi-tenant failure isn't data
   leakage, it's divergence: a client wants dark mode, another wants CSV instead of PDF, a third
   wants onboarding skipped — and a generator happily copies the repository and customizes. Eleven
   clients later there are eleven products sharing a name, nobody remembers which client runs which
   branch, and a security fix has to be applied eleven times (or is applied nine times). Three
   structures keep it one product:
   - **Feature flags scoped per tenant, not globally.** A flag isn't an on/off switch, it's a
     per-tenant value: one codebase reads the tenant context and renders the right behavior. Every
     configurable difference is a flag lookup, never a branch.
   - **Base configuration with override layers.** Every tenant inherits a shared default; tenant
     overrides merge on top at runtime. Update the base and everyone gets it *except* where they
     explicitly opted out — which is exactly the property forking destroys.
   - **Tenant resolution at the boundary.** Middleware identifies the tenant on every request —
     subdomain, header, or token claim — and injects that context *before* any business logic runs.
     Everything downstream (config, flags, branding, and the tenant scoping in `auth-access`
     AUTH-08/AUTH-11) keys off that one resolved identity.
   Retrofitting this after the forks exist means merging divergent codebases by hand; it's cheap on
   day one and expensive at client four.

10. **Keep one tenant's shape out of everyone's schema (DATA-11).** DATA-10 stops you forking the
    *code*; this stops you forking the *data model*. One client wants a custom field on every
    record, so a column goes into the shared table — and now every query, index, migration, backup,
    and restore carries a field that no other client asked for or can see. One tenant's request
    became everyone's tax, and it compounds with each release. Say yes with architecture instead:
    - **An extension layer for tenant-specific fields.** Custom attributes live in a tenant-scoped
      metadata table or a `JSONB` column, joined or projected only for the tenant that asked. The
      core schema stays clean and the extension grows without touching anyone else. Index the
      extension per tenant where it's actually queried — `JSONB` isn't free, it's just *isolated*.
    - **Isolated compute for heavy or bespoke workloads.** A tenant running a report that scans
      millions of rows should not be competing in real time with everyone else's requests. Route
      expensive per-tenant work to scoped workers or queues so one tenant's heavy Monday can't
      degrade the rest (the bulkhead argument from `reliability-recovery` REL-08, applied to
      tenants).
    - **Split the migration paths.** Changes to the extension layer run per tenant; changes to the
      core schema stay backwards compatible and expand-then-contract (DATA-09). No single tenant's
      evolution should force a system-wide deployment or a shared downtime window.

## Fix playbook

```text
Object storage permissions [DATA-03]:
 1. For each bucket: is public read on? is public LISTING on? Turn both off; default deny.
 2. Replace public links with signed URLs minted per request after your own authz check; minutes-long TTL.
 3. Re-key predictable objects to random names; keep the display filename in a DB column.
 4. Enforce content-type + size server-side; never take a path segment from a user-supplied filename.
 5. Verify signed out from another network: direct object fetch AND bucket listing must both be refused.
Mega-table found [DATA-01]:
 1. Identify entities (users, orders, items…) → one table each, FKs between.
 2. Migrate with a versioned migration; backfill; add indexes on the new join keys.
No migrations [DATA-04]:
 1. Adopt the ORM's migration tool (drizzle-kit / prisma migrate) — snapshot current schema as 0000.
 2. Rule: every schema change lands as a migration file in git, applied by deploy, never by hand.
Changing a live schema [DATA-09]:
 1. Write both scripts first: forward + rollback. Can't describe the reverse? Not ready.
 2. Restore the latest backup into staging (current data shapes) and run the migration there; time it.
 3. Production sequence: add new column -> backfill in batches -> dual-write -> switch reads ->
    verify -> drop old column in a LATER deploy. Never add and drop in one release.
 4. Postgres: CREATE INDEX CONCURRENTLY; avoid ALTER TABLE forms that rewrite the whole table.
One client's column in the shared table [DATA-11]:
 1. Find them: columns only one tenant writes/reads (nullable + ~100% null is the tell).
 2. Move to an extension: tenant_custom_fields(tenant_id, record_id, key, value) or a scoped JSONB column.
 3. Backfill that tenant, switch their reads/writes, drop the shared column in a LATER release (DATA-09).
 4. Route that tenant's heavy reports to a scoped worker/queue so the shared path stays fast.
Forked per client [DATA-10]:
 1. Diff the forks; list every real difference. Most are config (copy, flags, branding), not logic.
 2. Add tenant resolution middleware first (subdomain/header/claim -> tenant context on the request).
 3. Move each difference to a per-tenant flag or config override; merge base + overrides at runtime.
 4. Collapse forks into main one client at a time; delete the branch only after that tenant runs on it.
Multi-tenant retrofit [DATA-02]:
 1. Add tenant_id to every table; backfill from ownership chains.
 2. Turn on RLS policies keyed to tenant_id; verify a cross-tenant read fails.
```

## Examples

### Example 1: "The generator made one table with everything in it"
**Output**:
```
[DATA-01] That's a spreadsheet wearing a database costume. Split into entities with relations + FKs,
via a versioned migration [DATA-04]. B2B? add tenant_id + RLS now [DATA-02] — later is the hard way.
```

### Example 2: "Users upload photos — TEXT column with base64?"
**Output**:
```
[DATA-03] No — object storage + CDN, store the URL/key in the row.
Keeps the DB fast, backups small, and images cached at the edge.
```

## Do / Don't

- **Do** normalize the schema and decide tenancy before you have users.
- **Do** keep files in object storage; version every schema change.
- **Don't** edit production schema by hand or store blobs in rows.
- **Don't** leave conflict handling to "last write wins" in collaborative features.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
