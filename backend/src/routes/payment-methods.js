import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const TYPES = ['card_to_card', 'bank_account'];

function validate(body, { partial = false } = {}) {
  if (!partial || body.type !== undefined) {
    if (!TYPES.includes(body.type)) return 'نوع روش پرداخت نامعتبر است.';
  }
  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) return 'عنوان الزامی است.';
  }
  if (body.type === 'card_to_card' && (!body.card_number || !String(body.card_number).trim())) {
    return 'شماره کارت الزامی است.';
  }
  if (body.type === 'bank_account' && (!body.iban || !String(body.iban).trim())) {
    return 'شماره شبا الزامی است.';
  }
  return null;
}

router.get('/', requireAuth, (req, res) => {
  const methods = db
    .prepare('SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY sort_order ASC, id ASC')
    .all();
  res.json({ methods });
});

// Public fee summary for the "قوانین و کارمزدها" section on /about — no
// card/iban fields exposed here, just the transparency info a visitor
// (logged in or not) needs before deciding to sign up.
router.get('/public-summary', (req, res) => {
  const methods = db
    .prepare(
      `SELECT id, type, title, fee_percent, fee_fixed, min_amount, max_amount
       FROM payment_methods WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`
    )
    .all();
  res.json({ methods });
});

router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
  const methods = db.prepare('SELECT * FROM payment_methods ORDER BY sort_order ASC, id ASC').all();
  res.json({ methods });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const b = req.body;
  const err = validate(b);
  if (err) return res.status(400).json({ error: err });

  const info = db
    .prepare(
      `INSERT INTO payment_methods
       (type, title, card_number, card_holder_name, iban, account_holder_name, bank_name, instructions, fee_percent, fee_fixed, min_amount, max_amount, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.type,
      b.title.trim(),
      b.card_number || null,
      b.card_holder_name || null,
      b.iban || null,
      b.account_holder_name || null,
      b.bank_name || null,
      b.instructions || null,
      Number(b.fee_percent) || 0,
      Number(b.fee_fixed) || 0,
      Number(b.min_amount) || 0,
      b.max_amount ? Number(b.max_amount) : null,
      b.is_active === false ? 0 : 1,
      Number(b.sort_order) || 0
    );

  res.status(201).json({ method: db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const method = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(req.params.id);
  if (!method) return res.status(404).json({ error: 'روش پرداخت یافت نشد.' });

  const b = req.body;
  const err = validate(b, { partial: true });
  if (err) return res.status(400).json({ error: err });

  const merged = {
    type: b.type ?? method.type,
    title: b.title !== undefined ? String(b.title).trim() : method.title,
    card_number: b.card_number !== undefined ? b.card_number : method.card_number,
    card_holder_name: b.card_holder_name !== undefined ? b.card_holder_name : method.card_holder_name,
    iban: b.iban !== undefined ? b.iban : method.iban,
    account_holder_name: b.account_holder_name !== undefined ? b.account_holder_name : method.account_holder_name,
    bank_name: b.bank_name !== undefined ? b.bank_name : method.bank_name,
    instructions: b.instructions !== undefined ? b.instructions : method.instructions,
    fee_percent: b.fee_percent !== undefined ? Number(b.fee_percent) : method.fee_percent,
    fee_fixed: b.fee_fixed !== undefined ? Number(b.fee_fixed) : method.fee_fixed,
    min_amount: b.min_amount !== undefined ? Number(b.min_amount) : method.min_amount,
    max_amount: b.max_amount !== undefined ? (b.max_amount ? Number(b.max_amount) : null) : method.max_amount,
    is_active: b.is_active !== undefined ? (b.is_active ? 1 : 0) : method.is_active,
    sort_order: b.sort_order !== undefined ? Number(b.sort_order) : method.sort_order,
  };

  db.prepare(
    `UPDATE payment_methods SET type = ?, title = ?, card_number = ?, card_holder_name = ?, iban = ?, account_holder_name = ?,
     bank_name = ?, instructions = ?, fee_percent = ?, fee_fixed = ?, min_amount = ?, max_amount = ?, is_active = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    merged.type,
    merged.title,
    merged.card_number,
    merged.card_holder_name,
    merged.iban,
    merged.account_holder_name,
    merged.bank_name,
    merged.instructions,
    merged.fee_percent,
    merged.fee_fixed,
    merged.min_amount,
    merged.max_amount,
    merged.is_active,
    merged.sort_order,
    method.id
  );

  res.json({ method: db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(method.id) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const method = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(req.params.id);
  if (!method) return res.status(404).json({ error: 'روش پرداخت یافت نشد.' });

  const used = db.prepare('SELECT COUNT(*) AS c FROM deposit_requests WHERE payment_method_id = ?').get(method.id).c;
  if (used > 0) {
    return res.status(409).json({ error: 'این روش قبلاً برای شارژ استفاده شده و قابل حذف نیست؛ به‌جای حذف، غیرفعالش کنید.' });
  }

  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(method.id);
  res.json({ ok: true });
});

export default router;
