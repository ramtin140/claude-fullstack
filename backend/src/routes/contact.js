import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireContentManager } from '../middleware/auth.js';
import { sendEmailNotification } from '../services/notify.js';
import { emitContactUpdate } from '../services/realtime.js';

const router = Router();

router.post('/', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
    return res.status(400).json({ error: 'نام، ایمیل و متن پیام الزامی است.' });
  }

  const info = db
    .prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim(), message.trim());

  const admins = db.prepare("SELECT email FROM users WHERE role = 'senior_admin'").all();
  for (const { email: adminEmail } of admins) {
    sendEmailNotification(
      adminEmail,
      'پیام جدید از فرم تماس با ما',
      `از: ${name.trim()} (${email.trim()})\n\n${message.trim()}`
    );
  }
  emitContactUpdate();

  res.status(201).json({ message: db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(info.lastInsertRowid) });
});

router.get('/admin/all', requireAuth, requireContentManager, (req, res) => {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ messages: rows });
});

router.post('/:id/read', requireAuth, requireContentManager, (req, res) => {
  const msg = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'پیام یافت نشد.' });

  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(msg.id);
  emitContactUpdate();
  res.json({ message: db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(msg.id) });
});

export default router;
