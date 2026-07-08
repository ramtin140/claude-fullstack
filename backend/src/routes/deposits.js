import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { adjustWallet } from '../services/wallet.js';
import { notifyUser } from '../services/notifications.js';
import { uploadReceipt, publicReceiptUrl } from '../middleware/upload.js';
import { emitDepositsUpdate } from '../services/realtime.js';

const router = Router();

function getRate() {
  return Number(db.prepare("SELECT value FROM app_settings WHERE key = 'ticket_to_toman_rate'").get()?.value ?? 10000);
}

router.get('/rate', (req, res) => {
  res.json({ rate: getRate() });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT d.*, p.title AS method_title, p.type AS method_type
       FROM deposit_requests d JOIN payment_methods p ON p.id = d.payment_method_id
       WHERE d.user_id = ? ORDER BY d.created_at DESC`
    )
    .all(req.user.id);
  res.json({ requests: rows });
});

router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db
        .prepare(
          `SELECT d.*, u.name AS user_name, p.title AS method_title, p.type AS method_type
           FROM deposit_requests d JOIN users u ON u.id = d.user_id JOIN payment_methods p ON p.id = d.payment_method_id
           WHERE d.status = ? ORDER BY d.created_at DESC`
        )
        .all(status)
    : db
        .prepare(
          `SELECT d.*, u.name AS user_name, p.title AS method_title, p.type AS method_type
           FROM deposit_requests d JOIN users u ON u.id = d.user_id JOIN payment_methods p ON p.id = d.payment_method_id
           ORDER BY d.created_at DESC`
        )
        .all();
  res.json({ requests: rows });
});

// multipart/form-data: payment_method_id/cash_amount/reference_note arrive as
// string fields, the transfer receipt arrives as req.file — required, since
// this is the only proof an admin has to verify the deposit actually happened.
router.post('/', requireAuth, (req, res) => {
  uploadReceipt(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });
    if (!req.file) return res.status(400).json({ error: 'ارسال تصویر رسید واریز الزامی است.' });

    const method = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(req.body.payment_method_id);
    if (!method || !method.is_active) return res.status(400).json({ error: 'روش پرداخت انتخاب‌شده معتبر نیست.' });

    const cashAmount = Number(req.body.cash_amount);
    if (!Number.isInteger(cashAmount) || cashAmount <= 0) {
      return res.status(400).json({ error: 'مبلغ واریزی نامعتبر است.' });
    }
    if (cashAmount < method.min_amount) {
      return res.status(400).json({ error: `حداقل مبلغ برای این روش ${method.min_amount.toLocaleString('fa-IR')} تومان است.` });
    }
    if (method.max_amount && cashAmount > method.max_amount) {
      return res.status(400).json({ error: `حداکثر مبلغ برای این روش ${method.max_amount.toLocaleString('fa-IR')} تومان است.` });
    }

    const feeAmount = Math.round(method.fee_fixed + (cashAmount * method.fee_percent) / 100);
    const netAmount = cashAmount - feeAmount;
    const rate = getRate();
    const ticketAmount = Math.floor(netAmount / rate);
    if (ticketAmount < 1) {
      return res.status(400).json({ error: 'مبلغ واریزی پس از کسر کارمزد کمتر از یک تیکت است.' });
    }

    const receiptUrl = publicReceiptUrl(req.file.filename);
    const info = db
      .prepare(
        `INSERT INTO deposit_requests (user_id, payment_method_id, cash_amount, fee_amount, ticket_amount, reference_note, receipt_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.user.id, method.id, cashAmount, feeAmount, ticketAmount, req.body.reference_note || null, receiptUrl);

    emitDepositsUpdate();
    res.status(201).json({ request: db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(info.lastInsertRowid) });
  });
});

router.post('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  uploadReceipt(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const request = db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'درخواست یافت نشد.' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'این درخواست قبلاً بررسی شده است.' });

    adjustWallet(request.user_id, 'ticket', request.ticket_amount, 'deposit_approved', 'deposit_request', request.id);
    db.prepare(
      `UPDATE deposit_requests SET status = 'approved', admin_notes = ?, resolved_at = datetime('now') WHERE id = ?`
    ).run(req.body.admin_notes || null, request.id);

    notifyUser(request.user_id, `شارژ کیف پول شما تایید شد و ${request.ticket_amount} تیکت به حسابتان اضافه شد.`, 'success', '/wallet');
    emitDepositsUpdate();

    res.json({ request: db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(request.id) });
  });
});

router.post('/:id/reject', requireAuth, requireAdmin, (req, res) => {
  uploadReceipt(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const request = db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'درخواست یافت نشد.' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'این درخواست قبلاً بررسی شده است.' });

    const adminNotes = (req.body.admin_notes || '').trim();
    if (!adminNotes) return res.status(400).json({ error: 'لطفاً دلیل رد درخواست را بنویسید.' });

    db.prepare(
      `UPDATE deposit_requests SET status = 'rejected', admin_notes = ?, resolved_at = datetime('now') WHERE id = ?`
    ).run(adminNotes, request.id);

    notifyUser(request.user_id, `درخواست شارژ کیف پول شما رد شد: ${adminNotes}`, 'warning', '/wallet');
    emitDepositsUpdate();

    res.json({ request: db.prepare('SELECT * FROM deposit_requests WHERE id = ?').get(request.id) });
  });
});

export default router;
