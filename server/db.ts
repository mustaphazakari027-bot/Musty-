import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import initSqlJs, { type Database as SqliteDatabase } from 'sql.js';
import pg from 'pg';

export type Row = Record<string, any>;
export interface Result { rows: Row[]; rowCount: number }
export interface Queryable { query(sql: string, params?: any[]): Promise<Result> }
export interface Database extends Queryable { transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>; kind: 'postgres' | 'sqlite' }

export async function openDatabase(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });
    await pool.query('SELECT 1');
    return {
      kind: 'postgres',
      async query(sql, params = []) { const r = await pool.query(sql, params); return { rows: r.rows, rowCount: r.rowCount ?? 0 }; },
      async transaction(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const tx: Queryable = { async query(sql, params = []) { const r = await client.query(sql, params); return { rows: r.rows, rowCount: r.rowCount ?? 0 }; } };
          const result = await fn(tx); await client.query('COMMIT'); return result;
        } catch (e) { await client.query('ROLLBACK'); throw e; }
        finally { client.release(); }
      },
    };
  }
  const require = createRequire(import.meta.url);
  const wasm = require.resolve('sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({ locateFile: () => wasm });
  const file = path.resolve('data', 'demo.sqlite');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const raw: SqliteDatabase = fs.existsSync(file) ? new SQL.Database(fs.readFileSync(file)) : new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON');
  let last = Promise.resolve();
  async function locked<T>(fn: () => Promise<T> | T): Promise<T> {
    const before = last; let release!: () => void; last = new Promise<void>(r => { release = r; });
    await before; try { return await fn(); } finally { release(); }
  }
  function persist() { const tmp = `${file}.tmp`; fs.writeFileSync(tmp, Buffer.from(raw.export())); fs.renameSync(tmp, file); }
  function run(sql: string, params: any[] = []): Result {
    // sql.js supports named $1 parameters. Mapping by name also handles a parameter referenced twice.
    const bound: Record<string, any> = {}; params.forEach((p, i) => { bound[`$${i + 1}`] = p === undefined ? null : p; });
    const stmt = raw.prepare(sql); const rows: Row[] = [];
    try { if (params.length) stmt.bind(bound); while (stmt.step()) rows.push(stmt.getAsObject() as Row); }
    finally { stmt.free(); }
    return { rows, rowCount: /^\s*(insert|update|delete|replace)/i.test(sql) ? raw.getRowsModified() : rows.length };
  }
  return {
    kind: 'sqlite',
    query(sql, params = []) { return locked(() => { const result = run(sql, params); if (/^\s*(insert|update|delete|replace|create|drop|alter)/i.test(sql)) persist(); return result; }); },
    transaction(fn) { return locked(async () => { raw.run('BEGIN IMMEDIATE'); try { const result = await fn({ query: async (sql, params = []) => run(sql, params) }); raw.run('COMMIT'); persist(); return result; } catch (e) { raw.run('ROLLBACK'); throw e; } }); },
  };
}

export async function migrate(db: Database) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, image TEXT NOT NULL, color TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, category_id TEXT NOT NULL REFERENCES categories(id), description TEXT NOT NULL, unit TEXT NOT NULL, price INTEGER NOT NULL, old_price INTEGER, stock INTEGER NOT NULL DEFAULT 0, image TEXT NOT NULL, badge TEXT NOT NULL DEFAULT '', rating TEXT NOT NULL DEFAULT '', review_count INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS addresses (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), label TEXT NOT NULL, address TEXT NOT NULL, phone TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS promos (code TEXT PRIMARY KEY, percent INTEGER NOT NULL, minimum INTEGER NOT NULL DEFAULT 0, cap INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL, user_id TEXT REFERENCES users(id), token_hash TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '', delivery_date TEXT NOT NULL, delivery_time TEXT NOT NULL, delivery_type TEXT NOT NULL, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL, delivery_fee INTEGER NOT NULL, total INTEGER NOT NULL, promo_code TEXT NOT NULL DEFAULT '', payment_method TEXT NOT NULL, payment_status TEXT NOT NULL, status TEXT NOT NULL, stock_reserved INTEGER NOT NULL DEFAULT 1, expires_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id), name TEXT NOT NULL, unit TEXT NOT NULL, price INTEGER NOT NULL, quantity INTEGER NOT NULL, image TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS contact_messages (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS newsletter (email TEXT PRIMARY KEY, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at)`,
  ];
  for (const sql of statements) await db.query(sql);
}
