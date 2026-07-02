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
  version: "2.0.0"
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
| DATA-03 | Files/blobs in object storage + CDN, not database rows | P2 |
| DATA-04 | Versioned migrations exist; no schema edits directly in production | P1 |
| DATA-05 | Backups exist (restore testing → reliability-recovery REL-02) | P1 |
| DATA-06 | Platform fits the workload | → `database-selection` (DBS-01..04) |
| DATA-07 | Concurrent-write conflict strategy chosen (CRDTs where merging must be automatic) | P2 if collaborative |

## When to Use This Skill

- User mentions database design, schema, normalization, or "one big table".
- User mentions multi-tenant, tenant id, or separating customers' data.
- User mentions migrations, backups, or schema changes in production.
- User is choosing an ORM (Prisma/Drizzle) or storing images/files.
- (Which platform/provider → `database-selection`.)

## How It Works

1. **Model the data (DATA-01).** Break the catch-all table into normalized, related tables that
   reflect real entities. A designed schema survives features the generator never saw coming.
2. **Decide tenancy before scale (DATA-02).** Proven pattern: one database, **`tenant_id` on every
   table**, enforced by **row-level security** (see `app-security` SEC-04). Retrofitting isolation
   after launch is the expensive road.
3. **Blobs out of the database (DATA-03).** Images/files go to **object storage**, served via
   **CDN**; rows hold references. Cheaper, faster, and backups stay small.
4. **Migrations + backups, non-negotiable (DATA-04/05).** Versioned migrations for every schema
   change; scheduled backups whose restores get *tested* (→ `reliability-recovery`). Editing schema
   live in prod is a slow-motion outage.
5. **ORM by posture.** **Prisma**: schema-driven, type-safe guardrails. **Drizzle**: lighter,
   closer to SQL, more control. Either beats raw string queries from a generator.
6. **Concurrent writes (DATA-07).** "Last write wins" silently drops data in collaborative docs —
   pick a conflict strategy up front; use **CRDTs** where merging must be automatic.

## Fix playbook

```text
Mega-table found [DATA-01]:
 1. Identify entities (users, orders, items…) → one table each, FKs between.
 2. Migrate with a versioned migration; backfill; add indexes on the new join keys.
No migrations [DATA-04]:
 1. Adopt the ORM's migration tool (drizzle-kit / prisma migrate) — snapshot current schema as 0000.
 2. Rule: every schema change lands as a migration file in git, applied by deploy, never by hand.
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
