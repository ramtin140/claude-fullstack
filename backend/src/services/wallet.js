import { db } from '../db/index.js';

const COLUMN_BY_CURRENCY = { ticket: 'ticket_balance', xp: 'xp' };

function columnFor(currency) {
  const column = COLUMN_BY_CURRENCY[currency];
  if (!column) throw new Error(`ارز نامعتبر: ${currency}`);
  return column;
}

export function getBalance(userId, currency) {
  const column = columnFor(currency);
  const row = db.prepare(`SELECT ${column} AS balance FROM users WHERE id = ?`).get(userId);
  if (!row) throw new Error('کاربر یافت نشد.');
  return row.balance;
}

// amount > 0 credits, amount < 0 debits. Throws if a debit would go negative.
export function adjustWallet(userId, currency, amount, reason, referenceType = null, referenceId = null) {
  const column = columnFor(currency);
  const user = db.prepare(`SELECT ${column} AS balance FROM users WHERE id = ?`).get(userId);
  if (!user) throw new Error('کاربر یافت نشد.');

  const newBalance = user.balance + amount;
  if (newBalance < 0) {
    const err = new Error('موجودی کیف پول کافی نیست.');
    err.code = 'INSUFFICIENT_BALANCE';
    throw err;
  }

  db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(newBalance, userId);
  db.prepare(
    `INSERT INTO wallet_transactions (user_id, currency, amount, reason, reference_type, reference_id, balance_after)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, currency, amount, reason, referenceType, referenceId, newBalance);

  return newBalance;
}

export function listTransactions(userId, limit = 50) {
  return db
    .prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit);
}
