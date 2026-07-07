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

// CREATE TABLE IF NOT EXISTS above won't add new columns to a users table
// that already existed before the ticket/XP economy was introduced, so those
// additions are applied here as idempotent ALTER TABLEs instead.
const newUserColumns = [
  ['ticket_balance', 'INTEGER NOT NULL DEFAULT 0'],
  ['xp', 'INTEGER NOT NULL DEFAULT 0'],
  ['season_points', 'INTEGER NOT NULL DEFAULT 0'],
  ["grade", "TEXT NOT NULL DEFAULT 'D'"],
  ['draws', 'INTEGER NOT NULL DEFAULT 0'],
];
for (const [name, definition] of newUserColumns) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
  } catch (err) {
    if (!/duplicate column/i.test(err.message)) throw err;
  }
}
