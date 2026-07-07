import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { generateFifaSoulId } from '../services/identity.js';

const router = Router();

function publicUser(u) {
  const { password_hash, ...rest } = u;
  // SQLite has no boolean type — these columns come back as raw 0/1 integers,
  // and "0 && <Jsx/>" renders the literal text "0" in React instead of
  // nothing, so every boolean-shaped field must be normalized before it
  // leaves the API.
  return { ...rest, is_vip: Boolean(rest.is_vip), is_guest: Boolean(rest.is_guest) };
}

router.post('/register', (req, res) => {
  const { name, email, password, psn_id, xbox_id, steam_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'نام، ایمیل و رمز عبور الزامی است.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'این ایمیل قبلاً ثبت‌نام کرده است.' });
  }

  // Players without a console ID (PSN/XBOX/Steam) are marked as guests —
  // they still get a full account, just without console-based identification,
  // per spec: "کسانی که کد شناسایی ندارن... سایت میتونه بهشون یوزر مهمان بده".
  const hasConsoleId = Boolean(psn_id || xbox_id || steam_id);

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, fifa_soul_id, is_guest, psn_id, xbox_id, steam_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      email,
      password_hash,
      generateFifaSoulId(),
      hasConsoleId ? 0 : 1,
      psn_id || null,
      xbox_id || null,
      steam_id || null
    );

  if (!hasConsoleId) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(`${name} (Guest#${info.lastInsertRowid})`, info.lastInsertRowid);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ user: publicUser(user) });
});

export default router;
