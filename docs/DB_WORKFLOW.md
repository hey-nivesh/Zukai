# Zukai — Database Migration & Environment Workflow
**Document Version:** 1.0.0  
**Tooling:** Supabase CLI, PostgreSQL 15+, pgTAP Test Framework

---

## 1. Golden Rules of Database Management
1. **Zero Dashboard Schema Edits:** Never modify tables, columns, indexes, or policies directly inside the Supabase Studio dashboard. All changes must be codified as version-controlled migration files in `/supabase/migrations`.
2. **Immutable Applied Migrations:** Never edit or rewrite a migration that has already been deployed to a remote environment (staging or production). Mistakes must be corrected by creating a forward-rolling migration.
3. **Strict Zero-Loss Principle:** Production schema alterations must be backward-compatible (expand and contract pattern) to prevent application downtime.

---

## 2. Local Development Lifecycle

### Step 1: Start Local Supabase Stack
```powershell
# Set sandbox-friendly user profile environment
$env:USERPROFILE = "E:\Personal Projects\Zukai\.userprofile"
npx supabase start
```
This launches local Docker containers for PostgreSQL, PostgREST, GoTrue Auth, Realtime, Storage, and Inbucket (local email catcher).

### Step 2: Creating a New Migration
```powershell
npx supabase migration new <descriptive_slug>
# Example: npx supabase migration new add_tags_to_documents
```
This generates a timestamped migration file in `supabase/migrations/<timestamp>_<descriptive_slug>.sql`.

### Step 3: Applying & Resetting Migrations
```powershell
# Apply new pending migrations:
npx supabase db push

# Re-apply all migrations from scratch and run seed.sql:
npx supabase db reset
```

### Step 4: Testing Migrations (pgTAP)
```powershell
npx supabase test db
```

---

## 3. Remote Environments: Staging & Production

### Linking Projects:
```powershell
# Link to development project:
npx supabase link --project-ref <dev-project-ref>

# Link to production project:
npx supabase link --project-ref <prod-project-ref>
```

### Deploying Migrations:
```powershell
# Push migrations to linked remote database:
npx supabase db push
```

### Regenerating TypeScript Types:
Whenever the schema changes, update TypeScript database contracts:
```powershell
npm run db:types
```

---

## 4. Roll-Forward Strategy for Schema Mistakes

If a migration containing an error or incomplete policy is applied to production:
1. **Do NOT run `git revert` or delete the migration file.**
2. Generate a new migration immediately:
   ```powershell
   npx supabase migration new fix_<issue_description>
   ```
3. Write standard idempotent DDL (`ALTER TABLE ...`, `DROP POLICY IF EXISTS ...`, `CREATE POLICY ...`).
4. Validate locally using `npx supabase db reset` and run test suite `npx supabase test db`.
5. Deploy forward via `npx supabase db push`.

