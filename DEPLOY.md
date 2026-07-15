# Deploying Lattice

The app is a single Express server (`server/index.js`) that serves the static design
system + SPA **and** the `/api` backend on one port, backed by Postgres. Schema and plan
seeds are created automatically on boot (`initSchema()` in `server/db.js`).

## Run locally with Docker Compose

Builds the app image and runs it against a throwaway Postgres container:

```bash
docker compose up --build
# → http://localhost:5050/ui_kits/lattice-app/
```

Stop with `docker compose down` (add `-v` to also delete the database volume).

## Deploy to Render

### Option 1 — Blueprint (easiest)
Commit `render.yaml`, then in Render: **New → Blueprint → select this repo**. It provisions
the Postgres database, wires `DATABASE_URL`, and generates `JWT_SECRET` for you.

### Option 2 — Manual
1. **New → Postgres** → create the database. Copy its **Internal Database URL**.
2. **New → Web Service** → same repo → Runtime **Docker** (it uses the `Dockerfile`).
   - Health check path: `/api/health`
3. Add the environment variables below.

## Set up GitHub sign-in (required — it's the only way to log in)

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL:** `https://latticeatsha256.onrender.com/`
3. **Authorization callback URL:** `https://latticeatsha256.onrender.com/api/auth/github/callback`
   (this must be `<APP_URL>/api/auth/github/callback` exactly).
4. Copy the **Client ID**, generate a **Client secret**, and put both in the env vars below.

> For local testing, register a *second* OAuth App with callback
> `http://localhost:5050/api/auth/github/callback` and pass those creds to docker-compose.

## Environment variables (Render)

| Variable               | Required | Value                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------- |
| `DATABASE_URL`         | ✅       | The Postgres **Internal Database URL** from your Render database.      |
| `DB_SSL`               | ✅       | `true` — Render Postgres requires TLS.                                 |
| `JWT_SECRET`           | ✅       | A long random string (used to sign login cookies). Keep it secret.    |
| `APP_URL`              | ✅       | `https://latticeatsha256.onrender.com` — base URL for the OAuth callback. |
| `GITHUB_CLIENT_ID`     | ✅       | Client ID from your GitHub OAuth App.                                  |
| `GITHUB_CLIENT_SECRET` | ✅       | Client secret from your GitHub OAuth App. Keep it secret.             |
| `ADMIN_GITHUB_LOGIN`   | ✅       | `Yuukonori` — the GitHub username that gets the admin panel.           |
| `NODE_ENV`             | ➖       | `production` (recommended).                                           |
| `PORT`                 | ❌       | Do **not** set — Render injects it and the app reads `process.env.PORT`. |

> If you prefer discrete DB vars over `DATABASE_URL`, set `DB_HOST`, `DB_PORT`, `DB_USER`,
> `DB_PASSWORD`, `DB_NAME` instead (from the database's connection info) and keep `DB_SSL=true`.
> When `DATABASE_URL` is present it takes precedence.
