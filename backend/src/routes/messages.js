import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyUser } from '../services/notifications.js';
import { emitToUser } from '../services/realtime.js';

const router = Router();

function messagingEnabled() {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'messaging_enabled'").get();
  return row ? row.value === '1' : true;
}

router.get('/settings', (req, res) => {
  res.json({ messaging_enabled: messagingEnabled() });
});

// One row per conversation partner: the latest message plus how many of
// their messages to me are still unread.
router.get('/threads', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT
         u.id AS user_id, u.name, u.avatar_url,
         (SELECT body FROM messages m2 WHERE (m2.from_user_id = u.id AND m2.to_user_id = ?) OR (m2.from_user_id = ? AND m2.to_user_id = u.id) ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages m3 WHERE (m3.from_user_id = u.id AND m3.to_user_id = ?) OR (m3.from_user_id = ? AND m3.to_user_id = u.id) ORDER BY m3.created_at DESC LIMIT 1) AS last_at,
         (SELECT COUNT(*) FROM messages m4 WHERE m4.from_user_id = u.id AND m4.to_user_id = ? AND m4.read_at IS NULL) AS unread_count
       FROM users u
       WHERE u.id IN (
         SELECT from_user_id FROM messages WHERE to_user_id = ?
         UNION
         SELECT to_user_id FROM messages WHERE from_user_id = ?
       )
       ORDER BY last_at DESC`
    )
    .all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json({ threads: rows });
});

router.get('/:userId', requireAuth, (req, res) => {
  const otherId = Number(req.params.userId);
  const other = db.prepare('SELECT id, name, avatar_url FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ error: 'کاربر یافت نشد.' });

  const rows = db
    .prepare(
      `SELECT * FROM messages WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
       ORDER BY created_at ASC`
    )
    .all(req.user.id, otherId, otherId, req.user.id);

  db.prepare(`UPDATE messages SET read_at = datetime('now') WHERE from_user_id = ? AND to_user_id = ? AND read_at IS NULL`).run(
    otherId,
    req.user.id
  );

  res.json({ other, messages: rows });
});

router.post('/:userId', requireAuth, (req, res) => {
  if (!messagingEnabled()) {
    return res.status(403).json({ error: 'قابلیت پیام‌رسانی بین کاربران توسط مدیریت غیرفعال شده است.' });
  }

  const otherId = Number(req.params.userId);
  if (otherId === req.user.id) {
    return res.status(400).json({ error: 'نمی‌توانید به خودتان پیام دهید.' });
  }
  const other = db.prepare('SELECT id, name FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ error: 'کاربر یافت نشد.' });

  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'متن پیام نمی‌تواند خالی باشد.' });

  const info = db
    .prepare('INSERT INTO messages (from_user_id, to_user_id, body) VALUES (?, ?, ?)')
    .run(req.user.id, otherId, body.trim());
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);

  const sender = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  emitToUser(otherId, 'message:new', message);
  notifyUser(otherId, `پیام جدید از ${sender.name}`, 'info', `/messages/${req.user.id}`);

  res.status(201).json({ message });
});

export default router;
