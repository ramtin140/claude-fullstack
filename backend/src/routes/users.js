import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json({ users: rows.map(publicUser) });
});

router.put('/:id/role', requireAuth, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['member', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'نقش نامعتبر است.' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ user: publicUser(user) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
