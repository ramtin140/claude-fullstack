import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Railway (and most PaaS providers) inject platform-specific env vars at
// build/run time; their presence tells us we're running in production even
// if NODE_ENV itself was never explicitly set.
const isRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.RAILWAY_PROJECT_ID
);

const localDbPath = path.join(__dirname, '..', '..', 'data', 'fifasoul.db');
const productionDbPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data', 'fifasoul.db');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : isRailway
    ? productionDbPath
    : localDbPath;

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// CREATE TABLE IF NOT EXISTS above won't add new columns to a table that
// already existed before a feature was introduced, so those additions are
// applied here as idempotent ALTER TABLEs instead.
function addColumnsIfMissing(table, columns) {
  for (const [name, definition] of columns) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    } catch (err) {
      if (!/duplicate column/i.test(err.message)) throw err;
    }
  }
}

addColumnsIfMissing('users', [
  ['ticket_balance', 'INTEGER NOT NULL DEFAULT 0'],
  ['xp', 'INTEGER NOT NULL DEFAULT 0'],
  ['season_points', 'INTEGER NOT NULL DEFAULT 0'],
  ["grade", "TEXT NOT NULL DEFAULT 'D'"],
  ['draws', 'INTEGER NOT NULL DEFAULT 0'],
  ['fifa_soul_id', 'TEXT'],
  ['is_guest', 'INTEGER NOT NULL DEFAULT 0'],
  ['is_vip', 'INTEGER NOT NULL DEFAULT 0'],
  ['psn_id', 'TEXT'],
  ['xbox_id', 'TEXT'],
  ['steam_id', 'TEXT'],
]);

addColumnsIfMissing('tournaments', [
  ['bracket_size', 'INTEGER'],
  ['bracket_generated', 'INTEGER NOT NULL DEFAULT 0'],
]);

addColumnsIfMissing('matches', [
  ['round', 'INTEGER'],
  ['bracket_slot', 'INTEGER'],
  ['next_match_id', 'INTEGER REFERENCES matches(id)'],
  ['next_match_slot', 'TEXT'],
  ['is_bye', 'INTEGER NOT NULL DEFAULT 0'],
  ['winner_id', 'INTEGER REFERENCES users(id)'],
]);

// Role model grew from plain member/admin into the spec's actual tiers
// (مدیر ارشد / نویسنده / کارشناس مسابقات); carry any pre-existing admins
// forward as the top tier so nobody is silently locked out after upgrading.
db.exec(`UPDATE users SET role = 'senior_admin' WHERE role = 'admin'`);

// Backfill a random fifa soul ID for any user that predates this feature.
const usersMissingId = db.prepare('SELECT id FROM users WHERE fifa_soul_id IS NULL').all();
if (usersMissingId.length) {
  const setId = db.prepare('UPDATE users SET fifa_soul_id = ? WHERE id = ?');
  for (const { id } of usersMissingId) {
    let candidate;
    do {
      candidate = `FS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    } while (db.prepare('SELECT 1 FROM users WHERE fifa_soul_id = ?').get(candidate));
    setId.run(candidate, id);
  }
}
