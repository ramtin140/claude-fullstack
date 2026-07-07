import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin, ROLES } from '../middleware/auth.js';

const router = Router();

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json({ users: rows.map(publicUser) });
});

// "بازی بر اساس جستجوی یکدیگر کاربران... این قابلیت برای بازیکنان با اکانت
// وی‌آی‌پی می‌باشد" — both the search feature and the searcher must be VIP.
router.get('/search', requireAuth, (req, res) => {
  const me = db.prepare('SELECT is_vip FROM users WHERE id = ?').get(req.user.id);
  if (!me?.is_vip) {
    return res.status(403).json({ error: 'جستجوی حریف فقط برای کاربران وی‌آی‌پی است.' });
  }

  const { query } = req.query;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'عبارت جستجو باید حداقل ۲ کاراکتر باشد.' });
  }

  const like = `%${query.trim()}%`;
  const rows = db
    .prepare(
      `SELECT id, name, psn_id, xbox_id, steam_id, is_vip, grade FROM users
       WHERE id != ? AND (name LIKE ? OR psn_id LIKE ? OR xbox_id LIKE ? OR steam_id LIKE ?)
       LIMIT 20`
    )
    .all(req.user.id, like, like, like, like);
  res.json({ users: rows });
});

router.put('/:id/vip', requireAuth, requireAdmin, (req, res) => {
  const { is_vip } = req.body;
  db.prepare('UPDATE users SET is_vip = ? WHERE id = ?').run(is_vip ? 1 : 0, req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ user: publicUser(user) });
});

router.put('/:id/role', requireAuth, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
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
