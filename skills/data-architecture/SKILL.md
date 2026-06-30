---
name: data-architecture
description: >
  Designs the data layer so it survives growth: a real schema instead of one giant table, multi-tenancy
  decided up front, migrations and backups, choosing a database and ORM, putting files in object
  storage, and handling concurrent edits. Includes trade-offs across Supabase/Firebase/Convex/Neon/
  PlanetScale and Prisma/Drizzle. Activates when the user mentions database design, schema,
  multi-tenant, tenant id, migrations, backups, choosing a DB or ORM, storing images/files, or
  real-time conflicts/CRDTs. Applies only to apps that use a database.
user-invokable: true
metadata:
  category: data-architecture
---

# Database & Data Architecture

Generators tend to produce tables, not a design — often one sprawling table with dozens of columns
standing in for what should be several related ones. Data decisions (tenancy, storage, migrations) are
structural: cheap to get right at the start, painful to change once real data and users depend on them.

Skip if there's no database. Otherwise, freedom: **medium** — recommend the pattern, adapt to the stack.

## When to Use This Skill

- User mentions database design, schema, normalization, or "one big table".
- User mentions multi-tenant, tenant id, or separating customers' data.
- User mentions migrations, backups, or editing schema in production.
- User is choosing a DB (Supabase/Firebase/Convex/Neon/PlanetScale) or ORM (Prisma/Drizzle).
- The app stores images/files, or has collaborative data with concurrent edits.

## How It Works

1. **Model the data, don't just dump it in a table.** Break the catch-all table into related,
   normalized tables that reflect real entities and relationships.
2. **Decide multi-tenancy before you scale.** A simple, proven pattern: one database with a `tenant_id`
   on every table, enforced by **row-level security** (see `app-security` / `auth-access`). Retrofitting
   isolation after launch is the hard road.
3. **Keep files out of the database.** Store images and blobs in **object storage**, serve them through
   a **CDN**, and keep records separate from binaries — cheaper and faster.
4. **Migrations and backups are non-negotiable.** Editing schema directly in production with no
   migrations and no backups is a slow-motion disaster. Use versioned migrations and **tested** backups
   (restore drills: see `reliability-recovery`).
5. **Pick the database for the job, not the hype:**
   - **Firebase** for a fast prototype; **Supabase** for production Postgres you own.
   - **Convex** for real-time, no-SQL, no-migrations convenience — know the trade-offs before committing.
   - **Neon** (serverless Postgres) vs **PlanetScale** (serverless MySQL) — choose by team familiarity.
   - An all-in-one platform is a great start; unbundle it when auth, the engine, or scale outgrow it.
6. **Pick the ORM by preference:** **Prisma** for schema-driven, type-safe guardrails; **Drizzle** for
   lighter, closer-to-SQL control.
7. **Plan for concurrent writes.** "Last write wins" silently drops data in collaborative documents —
   choose a conflict strategy up front, and use **CRDTs** where you need automatic merging.

## Examples

### Example 1: "The generator made one table with everything in it"
**Action**: Redesign into a real schema.
**Output**:
```
That's a dumping ground, not a schema. Split into entities (users, orders, items…) with relations + keys.
If it's multi-tenant, add tenant_id now — adding isolation after launch is the expensive path.
```

### Example 2: "Supabase or Firebase?"
**Action**: Decide by ownership, query complexity, timeline.
**Output**:
```
- Throwaway prototype, fastest path  → Firebase.
- Real product, own your data, real SQL  → Supabase (Postgres).
Revisit when auth gets complex, the engine stops fitting, or you outgrow the scale.
```

## Do / Don't

- **Do** model a normalized schema and decide tenancy before you have users.
- **Do** keep files in object storage + CDN, with migrations and tested backups.
- **Don't** store binaries in the database or edit schema directly in production.
- **Don't** pick a database by hype — match it to ownership, queries, and timeline.
