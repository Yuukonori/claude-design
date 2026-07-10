const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
  // Render's external Postgres endpoint requires SSL; local Postgres doesn't support it.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
  `);

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
