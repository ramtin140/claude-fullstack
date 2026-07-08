import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { adjustWallet } from '../services/wallet.js';
import { resetSeason } from '../services/grading.js';

const router = Router();

router.get('/grade-thresholds', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM grade_thresholds ORDER BY min_points DESC').all();
  res.json({ thresholds: rows });
});

router.put('/grade-thresholds/:grade', requireAuth, requireAdmin, (req, res) => {
  const { min_points, max_points } = req.body;
  if (!Number.isInteger(min_points)) {
    return res.status(400).json({ error: 'حداقل امتیاز نامعتبر است.' });
  }
  const info = db
    .prepare('UPDATE grade_thresholds SET min_points = ?, max_points = ? WHERE grade = ?')
    .run(min_points, max_points ?? null, req.params.grade);
  if (info.changes === 0) return res.status(404).json({ error: 'گرید یافت نشد.' });
  res.json({ threshold: db.prepare('SELECT * FROM grade_thresholds WHERE grade = ?').get(req.params.grade) });
});

// Manual credit/debit — stands in for a real payment gateway / charge-code
// flow (نیاز به کد شارژ) that the spec flags as needing separate design work.
router.post('/wallet/:userId/adjust', requireAuth, requireAdmin, (req, res) => {
  const { currency, amount, reason } = req.body;
  if (!['ticket', 'xp'].includes(currency) || !Number.isInteger(amount) || amount === 0) {
    return res.status(400).json({ error: 'ورودی نامعتبر است.' });
  }
  try {
    const newBalance = adjustWallet(
      req.params.userId,
      currency,
      amount,
      reason || 'admin_adjustment',
      'admin_adjustment',
      req.user.id
    );
    res.json({ balance: newBalance });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
});

// Quarterly season reset (بایگانی + صفر کردن امتیاز فصلی). No scheduler is
// wired up since the exact cadence wasn't pinned down in the spec beyond
// "every 3 months" — admin triggers it manually for now.
router.post('/season/reset', requireAuth, requireAdmin, (req, res) => {
  const { season_name } = req.body;
  if (!season_name) return res.status(400).json({ error: 'نام فصل الزامی است.' });
  res.json(resetSeason(season_name));
});

router.get('/season/archive', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM season_archive ORDER BY archived_at DESC').all();
  res.json({ archive: rows });
});

router.get('/vip-threshold', requireAuth, requireAdmin, (req, res) => {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'vip_xp_threshold'").get();
  res.json({ threshold: Number(row?.value ?? 500) });
});

router.put('/vip-threshold', requireAuth, requireAdmin, (req, res) => {
  const { threshold } = req.body;
  if (!Number.isInteger(threshold) || threshold < 0) {
    return res.status(400).json({ error: 'مقدار آستانه نامعتبر است.' });
  }
  db.prepare(
    "INSERT INTO app_settings (key, value) VALUES ('vip_xp_threshold', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(threshold));
  res.json({ threshold });
});

router.get('/messaging-enabled', requireAuth, requireAdmin, (req, res) => {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'messaging_enabled'").get();
  res.json({ messaging_enabled: row ? row.value === '1' : true });
});

router.put('/messaging-enabled', requireAuth, requireAdmin, (req, res) => {
  const { messaging_enabled } = req.body;
  db.prepare(
    "INSERT INTO app_settings (key, value) VALUES ('messaging_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(messaging_enabled ? '1' : '0');
  res.json({ messaging_enabled: Boolean(messaging_enabled) });
});

router.put('/ticket-to-toman-rate', requireAuth, requireAdmin, (req, res) => {
  const { rate } = req.body;
  if (!Number.isInteger(rate) || rate < 1) {
    return res.status(400).json({ error: 'نرخ تبدیل نامعتبر است.' });
  }
  db.prepare(
    "INSERT INTO app_settings (key, value) VALUES ('ticket_to_toman_rate', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(rate));
  res.json({ rate });
});

router.get('/h2h-fee-percent', requireAuth, requireAdmin, (req, res) => {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'h2h_platform_fee_percent'").get();
  res.json({ fee_percent: Number(row?.value ?? 30) });
});

router.put('/h2h-fee-percent', requireAuth, requireAdmin, (req, res) => {
  const { fee_percent } = req.body;
  if (typeof fee_percent !== 'number' || fee_percent < 0 || fee_percent > 100) {
    return res.status(400).json({ error: 'درصد کارمزد باید عددی بین ۰ تا ۱۰۰ باشد.' });
  }
  db.prepare(
    "INSERT INTO app_settings (key, value) VALUES ('h2h_platform_fee_percent', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(fee_percent));
  res.json({ fee_percent });
});

// "درآمد و بازی‌ها" — every ticket-staked h2h match that finished with a
// winner, plus how much of the pot the platform withheld. Matches finished
// before this feature existed have platform_fee_amount = NULL (nothing was
// actually withheld from them, so they're shown but contribute 0 to totals).
router.get('/revenue', requireAuth, requireAdmin, (req, res) => {
  const feePercentRow = db.prepare("SELECT value FROM app_settings WHERE key = 'h2h_platform_fee_percent'").get();
  const feePercent = Number(feePercentRow?.value ?? 30);

  const totals = db
    .prepare(
      `SELECT
         COUNT(*) AS decided_matches,
         COALESCE(SUM(platform_fee_amount), 0) AS total_revenue,
         COALESCE(SUM(stake_amount * 2), 0) AS total_pot
       FROM h2h_matches
       WHERE status = 'completed' AND stake_type = 'ticket' AND winner_id IS NOT NULL`
    )
    .get();

  const matches = db
    .prepare(
      `SELECT m.id, m.stake_amount, m.platform_fee_amount, m.completed_at, m.winner_id,
              creator.name AS creator_name, opponent.name AS opponent_name, winner.name AS winner_name
       FROM h2h_matches m
       JOIN users creator ON creator.id = m.creator_id
       LEFT JOIN users opponent ON opponent.id = m.opponent_id
       LEFT JOIN users winner ON winner.id = m.winner_id
       WHERE m.status = 'completed' AND m.stake_type = 'ticket' AND m.winner_id IS NOT NULL
       ORDER BY m.completed_at DESC
       LIMIT 200`
    )
    .all();

  res.json({
    fee_percent: feePercent,
    total_revenue: totals.total_revenue,
    total_pot: totals.total_pot,
    decided_matches: totals.decided_matches,
    matches,
  });
});

export default router;
