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

export default router;
