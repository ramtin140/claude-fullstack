import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function publicNotification(n) {
  return { ...n, is_read: Boolean(n.is_read) };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(req.user.id);
  res.json({ notifications: rows.map(publicNotification) });
});

router.post('/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ ok: true });
});

export default router;
