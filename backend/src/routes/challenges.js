import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { sendEmailNotification } from '../services/notify.js';
import { notifyUser } from '../services/notifications.js';

const router = Router();

function isVip(userId) {
  return Boolean(db.prepare('SELECT is_vip FROM users WHERE id = ?').get(userId)?.is_vip);
}

function userEmail(userId) {
  return db.prepare('SELECT email FROM users WHERE id = ?').get(userId)?.email;
}

router.get('/incoming', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, u.name AS from_user_name FROM challenges c
       JOIN users u ON u.id = c.from_user_id
       WHERE c.to_user_id = ? AND c.status = 'pending' ORDER BY c.created_at DESC`
    )
    .all(req.user.id);
  res.json({ challenges: rows });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM challenges WHERE from_user_id = ? OR to_user_id = ? ORDER BY created_at DESC')
    .all(req.user.id, req.user.id);
  res.json({ challenges: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { to_user_id } = req.body;
  if (!isVip(req.user.id)) {
    return res.status(403).json({ error: 'ارسال چالش فقط برای کاربران وی‌آی‌پی است.' });
  }
  if (!to_user_id || Number(to_user_id) === req.user.id) {
    return res.status(400).json({ error: 'کاربر مقصد نامعتبر است.' });
  }
  const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(to_user_id);
  if (!target) return res.status(404).json({ error: 'کاربر یافت نشد.' });

  const info = db
    .prepare('INSERT INTO challenges (from_user_id, to_user_id) VALUES (?, ?)')
    .run(req.user.id, to_user_id);

  if (target.email) {
    sendEmailNotification(target.email, 'چالش جدید دریافت کردید', 'یک بازیکن شما را به مسابقه رو-در-رو دعوت کرده است.');
  }

  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(info.lastInsertRowid);
  const fromUser = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  notifyUser(to_user_id, `${fromUser?.name} شما را به مسابقه رو-در-رو دعوت کرد.`, 'info', '/dashboard');

  res.status(201).json({ challenge });
});

// Accepting creates an already-locked (free/XP-stake) h2h match directly —
// same two-leg structure as the normal join flow, skipping the open/browse step.
router.post('/:id/accept', requireAuth, (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'چالش یافت نشد.' });
  if (challenge.to_user_id !== req.user.id) {
    return res.status(403).json({ error: 'این چالش برای شما نیست.' });
  }
  if (challenge.status !== 'pending') {
    return res.status(409).json({ error: 'این چالش قبلاً پاسخ داده شده است.' });
  }

  const tx = db.transaction(() => {
    const matchInfo = db
      .prepare(
        `INSERT INTO h2h_matches (creator_id, opponent_id, stake_type, stake_amount, status, locked_at)
         VALUES (?, ?, 'xp', 0, 'locked', datetime('now'))`
      )
      .run(challenge.from_user_id, challenge.to_user_id);

    db.prepare(
      `INSERT INTO h2h_legs (match_id, leg_number, home_user_id, away_user_id) VALUES (?, 1, ?, ?)`
    ).run(matchInfo.lastInsertRowid, challenge.from_user_id, challenge.to_user_id);
    db.prepare(
      `INSERT INTO h2h_legs (match_id, leg_number, home_user_id, away_user_id) VALUES (?, 2, ?, ?)`
    ).run(matchInfo.lastInsertRowid, challenge.to_user_id, challenge.from_user_id);

    db.prepare(
      `UPDATE challenges SET status = 'accepted', h2h_match_id = ?, resolved_at = datetime('now') WHERE id = ?`
    ).run(matchInfo.lastInsertRowid, challenge.id);

    return matchInfo.lastInsertRowid;
  });

  const matchId = tx();

  const email = userEmail(challenge.from_user_id);
  if (email) sendEmailNotification(email, 'چالش شما پذیرفته شد', 'حریف چالش شما را پذیرفت و مسابقه شروع شد.');
  notifyUser(challenge.from_user_id, 'حریف چالش شما را پذیرفت!', 'success', `/h2h/${matchId}`);

  res.json({ challenge: db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge.id), h2h_match_id: matchId });
});

router.post('/:id/decline', requireAuth, (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'چالش یافت نشد.' });
  if (challenge.to_user_id !== req.user.id) {
    return res.status(403).json({ error: 'این چالش برای شما نیست.' });
  }
  if (challenge.status !== 'pending') {
    return res.status(409).json({ error: 'این چالش قبلاً پاسخ داده شده است.' });
  }

  db.prepare(`UPDATE challenges SET status = 'declined', resolved_at = datetime('now') WHERE id = ?`).run(challenge.id);
  notifyUser(challenge.from_user_id, 'حریف چالش شما را رد کرد.', 'warning', '/dashboard');
  res.json({ challenge: db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge.id) });
});

export default router;
