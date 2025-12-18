# D1 Database Setup (nameo-db)

This project uses **Cloudflare D1** to store users, campaigns, options, and check results.
The schema lives in `backend/db/schema.sql`.

## 1. Create the D1 database

From the repo root:

```bash
npx wrangler d1 create nameo-db
```

Wrangler will print something like:

```text
Created D1 database nameo-db (id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
```

Copy that `id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "NAMEO_DB"                # used in Worker as env.NAMEO_DB
database_name = "nameo-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # replace with real id
```

## 2. Apply the schema

Still from the repo root, run:

```bash
npx wrangler d1 execute nameo-db --file=backend/db/schema.sql
```

This will create the tables:

- `users`
- `campaigns`
- `options`
- `option_checks`

You can re-run this command safely; `CREATE TABLE IF NOT EXISTS` guards against duplicates.

## 3. Local development (optional)

You can also run the schema against a local D1 instance:

```bash
npx wrangler d1 execute nameo-db --local --file=backend/db/schema.sql
```

Then run the Worker locally with:

```bash
npx wrangler dev
```

The Worker will see the D1 binding as `env.NAMEO_DB`.
