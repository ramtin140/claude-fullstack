import { db } from '../db/index.js';

// Site-issued unique identifier, independent of any console account —
// every user gets one at registration ("ایدی تصادفی سایت بده fifa soul ID").
export function generateFifaSoulId() {
  let candidate;
  do {
    candidate = `FS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (db.prepare('SELECT 1 FROM users WHERE fifa_soul_id = ?').get(candidate));
  return candidate;
}
