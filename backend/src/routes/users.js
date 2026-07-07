import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin, ROLES } from '../middleware/auth.js';
import { uploadAvatar, publicAvatarUrl } from '../middleware/upload.js';

const router = Router();

function publicUser(u) {
  const { password_hash, ...rest } = u;
  // Same normalization as auth.js's publicUser — see the comment there.
  return { ...rest, is_vip: Boolean(rest.is_vip), is_guest: Boolean(rest.is_guest) };
}

// Fields safe to show on another user's public profile — no email, no
// banking info (iban/card_number stay private to the account owner).
function publicProfile(u) {
  const { id, name, avatar_url, fifa_soul_id, is_guest, is_vip, psn_id, xbox_id, steam_id, grade, season_points, points, wins, losses, draws, created_at } = u;
  return { id, name, avatar_url, fifa_soul_id, is_guest: Boolean(is_guest), is_vip: Boolean(is_vip), psn_id, xbox_id, steam_id, grade, season_points, points, wins, losses, draws, created_at };
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

// Full profile: own account (private fields incl. iban/card_number/email).
router.get('/me/profile', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ user: publicUser(user) });
});

router.put('/me/profile', requireAuth, (req, res) => {
  const { name, psn_id, xbox_id, steam_id, iban, card_number } = req.body;

  if (iban && !/^IR\d{24}$/i.test(iban.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'شماره شبا نامعتبر است (باید با IR شروع شود و ۲۴ رقم داشته باشد).' });
  }
  if (card_number && !/^\d{16}$/.test(card_number.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'شماره کارت باید ۱۶ رقم باشد.' });
  }

  db.prepare(
    `UPDATE users SET name = COALESCE(?, name), psn_id = COALESCE(?, psn_id), xbox_id = COALESCE(?, xbox_id),
     steam_id = COALESCE(?, steam_id), iban = COALESCE(?, iban), card_number = COALESCE(?, card_number) WHERE id = ?`
  ).run(
    name ?? null,
    psn_id ?? null,
    xbox_id ?? null,
    steam_id ?? null,
    iban ? iban.replace(/\s/g, '').toUpperCase() : iban === '' ? '' : null,
    card_number ? card_number.replace(/\s/g, '') : card_number === '' ? '' : null,
    req.user.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.post('/me/avatar', requireAuth, (req, res) => {
  uploadAvatar(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });
    if (!req.file) return res.status(400).json({ error: 'فایل عکس ارسال نشده است.' });

    const avatarUrl = publicAvatarUrl(req.file.filename);
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
    res.json({ avatar_url: avatarUrl });
  });
});

// Public read-only profile — shown when clicking another player's name.
router.get('/:id/profile', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ user: publicProfile(user) });
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
