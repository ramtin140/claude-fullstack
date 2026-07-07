import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireContentManager } from '../middleware/auth.js';
import { notifyUser } from '../services/notifications.js';

const router = Router();

const CATEGORIES = ['wallet', 'h2h', 'tournaments', 'account', 'other'];
const CATEGORY_LABELS = {
  wallet: 'کیف پول و تیکت',
  h2h: 'مسابقات رو-در-رو',
  tournaments: 'تورنمنت‌ها',
  account: 'حساب کاربری',
  other: 'سایر موارد',
};

function getTicketOr404(id, res) {
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
  if (!ticket) {
    res.status(404).json({ error: 'تیکت پشتیبانی یافت نشد.' });
    return null;
  }
  return ticket;
}

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })) });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id);
  res.json({ tickets: rows });
});

router.get('/admin/all', requireAuth, requireContentManager, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db
        .prepare(
          `SELECT t.*, u.name AS user_name FROM support_tickets t JOIN users u ON u.id = t.user_id
           WHERE t.status = ? ORDER BY t.updated_at DESC`
        )
        .all(status)
    : db
        .prepare(
          `SELECT t.*, u.name AS user_name FROM support_tickets t JOIN users u ON u.id = t.user_id ORDER BY t.updated_at DESC`
        )
        .all();
  res.json({ tickets: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { category, subject, body } = req.body;
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'دسته‌بندی نامعتبر است.' });
  }
  if (!subject || !subject.trim() || !body || !body.trim()) {
    return res.status(400).json({ error: 'موضوع و متن پیام الزامی است.' });
  }

  const info = db
    .prepare('INSERT INTO support_tickets (user_id, category, subject) VALUES (?, ?, ?)')
    .run(req.user.id, category, subject.trim());
  db.prepare('INSERT INTO support_messages (ticket_id, sender_id, is_staff, body) VALUES (?, ?, 0, ?)').run(
    info.lastInsertRowid,
    req.user.id,
    body.trim()
  );

  res.status(201).json({ ticket: db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(info.lastInsertRowid) });
});

router.get('/:id', requireAuth, (req, res) => {
  const ticket = getTicketOr404(req.params.id, res);
  if (!ticket) return;
  const isStaff = ['senior_admin', 'writer'].includes(req.user.role);
  if (!isStaff && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'شما به این تیکت دسترسی ندارید.' });
  }

  const messages = db
    .prepare(
      `SELECT sm.*, u.name AS sender_name FROM support_messages sm JOIN users u ON u.id = sm.sender_id
       WHERE sm.ticket_id = ? ORDER BY sm.created_at ASC`
    )
    .all(ticket.id);
  res.json({ ticket, messages });
});

router.post('/:id/reply', requireAuth, (req, res) => {
  const ticket = getTicketOr404(req.params.id, res);
  if (!ticket) return;
  const isStaff = ['senior_admin', 'writer'].includes(req.user.role);
  if (!isStaff && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'شما به این تیکت دسترسی ندارید.' });
  }
  if (ticket.status === 'closed') {
    return res.status(409).json({ error: 'این تیکت بسته شده است.' });
  }

  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'متن پیام نمی‌تواند خالی باشد.' });

  db.prepare('INSERT INTO support_messages (ticket_id, sender_id, is_staff, body) VALUES (?, ?, ?, ?)').run(
    ticket.id,
    req.user.id,
    isStaff ? 1 : 0,
    body.trim()
  );

  const newStatus = isStaff ? 'answered' : 'open';
  db.prepare("UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, ticket.id);

  if (isStaff) {
    notifyUser(ticket.user_id, `پشتیبانی به تیکت شما (${ticket.subject}) پاسخ داد.`, 'info', `/support/${ticket.id}`);
  }

  res.json({ ticket: db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticket.id) });
});

router.post('/:id/close', requireAuth, requireContentManager, (req, res) => {
  const ticket = getTicketOr404(req.params.id, res);
  if (!ticket) return;
  db.prepare("UPDATE support_tickets SET status = 'closed', updated_at = datetime('now') WHERE id = ?").run(ticket.id);
  notifyUser(ticket.user_id, `تیکت شما (${ticket.subject}) بسته شد.`, 'info', `/support/${ticket.id}`);
  res.json({ ticket: db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticket.id) });
});

export default router;
