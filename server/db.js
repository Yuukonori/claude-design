const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

// Prefer a single connection string (Render / Heroku style) when present; otherwise discrete vars.
// SSL: forced off with DB_SSL=false (local Postgres / docker-compose can't do TLS); on when
// DB_SSL=true, or by default whenever DATABASE_URL is used (managed Postgres like Render needs TLS).
const useUrl = !!process.env.DATABASE_URL;
const ssl = process.env.DB_SSL === 'false'
  ? false
  : (process.env.DB_SSL === 'true' || useUrl)
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool(useUrl
  ? { connectionString: process.env.DATABASE_URL, ssl, max: 10 }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
      ssl,
      max: 10,
    });

const query = (text, params) => pool.query(text, params);

const PLAN_SEED = [
  { id: 'free', name: 'Free',  price_monthly: 0,  price_annual: 0,   tagline: 'For trying things out',
    features: ['1 project', '2 pages per project', 'Local-only export', 'Community support'] },
  { id: 'pro',  name: 'Pro',   price_monthly: 12, price_annual: 120, tagline: 'For working designers',
    features: ['Unlimited projects', 'Unlimited pages', 'Code export', 'Version history', 'Priority support'] },
  { id: 'team', name: 'Team',  price_monthly: 24, price_annual: 240, tagline: 'For design teams',
    features: ['Everything in Pro', 'Up to 20 members', 'Shared component library', 'Roles & permissions', 'SSO'] },
];

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_monthly INTEGER NOT NULL,
      price_annual INTEGER NOT NULL,
      tagline TEXT,
      features JSONB NOT NULL DEFAULT '[]'::jsonb
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES plans(id),
      status TEXT NOT NULL DEFAULT 'active',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      canvas JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      status TEXT NOT NULL DEFAULT 'invited',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      period TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS library_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,        -- 'component' | 'shader' | 'animation' | 'template' | 'plugin'
      name TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,   -- asset payload (props / glsl / frames / canvas / actions)
      source TEXT,               -- market item id it was installed from, or 'custom'
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS ai_usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tool TEXT NOT NULL,        -- AI Helper tool id that was invoked
      tokens INTEGER NOT NULL,   -- fixed token cost charged for this call
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage(user_id);

    -- What the agent has been observed getting WRONG, so the mistake can be fed back into its prompt.
    -- Global on purpose (no user_id): these are the model's failure modes, not anyone's taste, and a
    -- lesson learned from one user's turn is worth having for everybody.
    -- This lives in Postgres rather than a JSON file because the Render container's filesystem is
    -- EPHEMERAL — a file written at runtime is wiped on every restart/redeploy, so "learning" would
    -- silently reset to zero forever. The curated seed still ships as server/learning/lessons.json.
    CREATE TABLE IF NOT EXISTS ai_lessons (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,     -- stable dedupe key, e.g. 'unknownOp:setPageProp:height'
      stage TEXT NOT NULL,          -- which pipeline stage should be told ('implement', 'prepare', …)
      text TEXT NOT NULL,           -- the sentence injected into that stage's prompt
      observations INTEGER NOT NULL DEFAULT 1,   -- evidence: how many times we've seen this mistake
      last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ai_lessons_stage_idx ON ai_lessons(stage, observations DESC);
  `);

  // Migration: move identity to GitHub OAuth. Idempotent — safe on an existing (password-era) DB.
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id BIGINT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS github_login TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_token_limit INTEGER NOT NULL DEFAULT 500000;
    ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS effort TEXT;
  `);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_key ON users(github_id) WHERE github_id IS NOT NULL`);

  for (const p of PLAN_SEED) {
    await query(
      `INSERT INTO plans (id, name, price_monthly, price_annual, tagline, features)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET
         name=EXCLUDED.name, price_monthly=EXCLUDED.price_monthly, price_annual=EXCLUDED.price_annual,
         tagline=EXCLUDED.tagline, features=EXCLUDED.features`,
      [p.id, p.name, p.price_monthly, p.price_annual, p.tagline, JSON.stringify(p.features)]
    );
  }
}

module.exports = { pool, query, initSchema };
