import { db } from '../db/index.js';
import { emitToUser } from './realtime.js';

// Single entry point for "tell this user something happened" — persists the
// notification first (so it survives a page reload or being offline when it
// fired) then pushes it live over the socket. Every h2h/challenge/message
// event that used to emit a bespoke socket event now goes through here
// instead, so the bell dropdown and the live toast always agree.
export function notifyUser(userId, message, tone = 'info', link = null) {
  const info = db
    .prepare('INSERT INTO notifications (user_id, message, tone, link) VALUES (?, ?, ?, ?)')
    .run(userId, message, tone, link);
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(info.lastInsertRowid);
  emitToUser(userId, 'notification:new', { ...row, is_read: Boolean(row.is_read) });
  return row;
}
