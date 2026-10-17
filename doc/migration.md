# Database Migration Guide (TypeORM)

This guide explains how database migrations are configured in `server` and provides a step-by-step workflow for generating, creating, running, and reverting migrations.

---

## 1. Configuration Overview

- **CLI DataSource**: [`server/src/database/data-source.ts`](../server/src/database/data-source.ts)
- **NestJS Database Provider**: [`server/src/database/database.provider.ts`](../server/src/database/database.provider.ts)
- **Migrations Directory**: [`server/src/database/migrations/`](../server/src/database/migrations/)
- **Migrations Table Name**: `migrations`

### Environment Variables (`server/.env.development` / `server/.env.production`)

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=lms
DB_PASSWORD=lms@
DB_DATABASE=lms
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
```

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `DB_SYNCHRONIZE` | Automatically syncs schema on startup without migrations. **Must be `false` when using `migration:generate`** so TypeORM can detect schema diffs. | `false` (Production & Migration workflow) |
| `DB_MIGRATIONS_RUN` | Automatically runs pending migrations when the NestJS server starts. | `true` |

---

## 2. `migration:generate` vs `migration:create`

| Command | Connects to DB? | Writes SQL Automatically? | When to Use |
| :--- | :--- | :--- | :--- |
| **`migration:generate`** | Yes | Yes (compares `*.entity.ts` vs DB) | Adding/modifying/removing entities, columns, relations, or constraints (90% of cases). |
| **`migration:create`** | No | No (creates empty `up`/`down` methods) | Custom SQL queries, data backfills (`UPDATE ...`), custom PostgreSQL indexes, triggers, or extensions. |

---

## 3. Step-by-Step Migration Process

### Step 1: Disable Auto-Synchronize
In `server/.env.development`, ensure `DB_SYNCHRONIZE` is set to `false`:
```env
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
```

### Step 2: Update or Create Your Entity
Make your schema changes in any `*.entity.ts` file inside `server/src/modules/**/entities/`.

### Step 3: Generate the Migration
Run `migration:generate` and pass the target path with a descriptive migration name:

**Option A: Running via Docker (Recommended when `DB_HOST=postgres`)**
```bash
docker exec -it sm_lms_dev_server_app npm run migration:generate -- src/database/migrations/AddYourFeatureName
```

**Option B: Running Locally on Host (inside `server/`)**
```bash
cd server
npm run migration:generate -- src/database/migrations/AddYourFeatureName
```
*(Note: If running on the host machine against the Docker Postgres container, use `DB_HOST=127.0.0.1` and `DB_PORT=5543`.)*

### Step 4: Review the Generated File
Check the newly created file in `server/src/database/migrations/<timestamp>-AddYourFeatureName.ts` and verify the `up()` and `down()` queries.

### Step 5: Run Pending Migrations
Apply the migration to the database:

**Via Docker:**
```bash
docker exec -it sm_lms_dev_server_app npm run migration:run
```

**Locally (inside `server/`):**
```bash
npm run migration:run
```
*(With `DB_MIGRATIONS_RUN=true`, pending migrations also execute automatically on server startup.)*

### Step 6: Check Migration Status
Verify which migrations have been applied (`[X]`) or are pending (`[ ]`):

**Via Docker:**
```bash
docker exec -it sm_lms_dev_server_app npm run migration:show
```

**Locally (inside `server/`):**
```bash
npm run migration:show
```

### Step 7: Commit Changes
Commit both the updated entity file(s) and the generated migration file:
```bash
git add server/src/
git commit -m "feat(db): add migration for <feature>"
```

---

## 4. All Available NPM Scripts (`server/package.json`)

| Script | Command | Description |
| :--- | :--- | :--- |
| **Generate** | `npm run migration:generate -- src/database/migrations/<Name>` | Auto-generates migration from entity changes |
| **Create** | `npm run migration:create -- src/database/migrations/<Name>` | Creates an empty migration template |
| **Run (Dev)** | `npm run migration:run` | Executes all pending migrations (`ts-node`) |
| **Run (Prod)** | `npm run migration:run:prod` | Executes compiled migrations from `dist/` |
| **Revert** | `npm run migration:revert` | Rolls back the most recently applied migration |
| **Show** | `npm run migration:show` | Lists all migrations and their applied status |

