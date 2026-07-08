import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { adjustWallet } from '../services/wallet.js';
import { notifyUser } from '../services/notifications.js';
import { uploadReceipt, publicReceiptUrl } from '../middleware/upload.js';
import { emitWithdrawalsUpdate } from '../services/realtime.js';

const router = Router();

function getRate() {
  return Number(db.prepare("SELECT value FROM app_settings WHERE key = 'ticket_to_toman_rate'").get()?.value ?? 10000);
}

router.get('/rate', (req, res) => {
  res.json({ rate: getRate() });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ requests: rows });
});

router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db
        .prepare(
          `SELECT w.*, u.name AS user_name FROM withdrawal_requests w JOIN users u ON u.id = w.user_id
           WHERE w.status = ? ORDER BY w.created_at DESC`
        )
        .all(status)
    : db
        .prepare(`SELECT w.*, u.name AS user_name FROM withdrawal_requests w JOIN users u ON u.id = w.user_id ORDER BY w.created_at DESC`)
        .all();
  res.json({ requests: rows });
});

// Tickets are deducted immediately (escrow-style) so the same balance can't
// fund two pending requests at once; rejection refunds them automatically.
router.post('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT ticket_balance, iban, card_number FROM users WHERE id = ?').get(req.user.id);
  if (!user.iban) {
    return res.status(400).json({ error: 'برای برداشت تیکت، ابتدا شماره شبا خود را در پروفایل ثبت کنید.' });
  }

  const ticketAmount = Number(req.body.ticket_amount);
  if (!Number.isInteger(ticketAmount) || ticketAmount < 1) {
    return res.status(400).json({ error: 'تعداد تیکت نامعتبر است.' });
  }
  if (ticketAmount > user.ticket_balance) {
    return res.status(402).json({ error: 'موجودی تیکت شما کافی نیست.' });
  }

  const rate = getRate();
  const cashAmount = ticketAmount * rate;

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO withdrawal_requests (user_id, ticket_amount, cash_amount, iban, card_number)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(req.user.id, ticketAmount, cashAmount, user.iban, user.card_number || null);
    adjustWallet(req.user.id, 'ticket', -ticketAmount, 'withdrawal_request', 'withdrawal_request', info.lastInsertRowid);
    return info.lastInsertRowid;
  });

  let requestId;
  try {
    requestId = tx();
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({ error: 'موجودی تیکت شما کافی نیست.' });
    }
    throw err;
  }

  emitWithdrawalsUpdate();
  res.status(201).json({ request: db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(requestId) });
});

// multipart/form-data: admin_notes arrives as a string field, an optional
// receipt_file (transfer proof/فیش) arrives as req.file.
router.post('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  uploadReceipt(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const request = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'درخواست یافت نشد.' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'این درخواست قبلاً بررسی شده است.' });

    const receiptUrl = req.file ? publicReceiptUrl(req.file.filename) : null;
    db.prepare(
      `UPDATE withdrawal_requests SET status = 'paid', admin_notes = ?, receipt_url = ?, resolved_at = datetime('now') WHERE id = ?`
    ).run(req.body.admin_notes || null, receiptUrl, request.id);

    notifyUser(
      request.user_id,
      `درخواست برداشت شما به مبلغ ${request.cash_amount.toLocaleString('fa-IR')} تومان پرداخت شد.`,
      'success',
      '/wallet'
    );
    emitWithdrawalsUpdate();

    res.json({ request: db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(request.id) });
  });
});

router.post('/:id/reject', requireAuth, requireAdmin, (req, res) => {
  uploadReceipt(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const request = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'درخواست یافت نشد.' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'این درخواست قبلاً بررسی شده است.' });

    const adminNotes = (req.body.admin_notes || '').trim();
    if (!adminNotes) return res.status(400).json({ error: 'لطفاً دلیل رد درخواست را بنویسید.' });

    const tx = db.transaction(() => {
      adjustWallet(request.user_id, 'ticket', request.ticket_amount, 'withdrawal_refund', 'withdrawal_request', request.id);
      db.prepare(
        `UPDATE withdrawal_requests SET status = 'rejected', admin_notes = ?, resolved_at = datetime('now') WHERE id = ?`
      ).run(adminNotes, request.id);
    });
    tx();

    notifyUser(request.user_id, `درخواست برداشت تیکت شما رد شد: ${adminNotes}`, 'warning', '/wallet');
    emitWithdrawalsUpdate();

    res.json({ request: db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(request.id) });
  });
});

export default router;
