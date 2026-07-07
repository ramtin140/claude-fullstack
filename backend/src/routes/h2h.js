import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { adjustWallet, getBalance } from '../services/wallet.js';
import { addSeasonPoints, RESULT_POINTS } from '../services/grading.js';
import { sendEmailNotification } from '../services/notify.js';

const router = Router();

const MAX_TICKET_STAKE = 5;

function publicMatch(match) {
  const { password_hash, ...rest } = match;
  return { ...rest, is_private: Boolean(rest.is_private), has_password: Boolean(password_hash) };
}

function getLegs(matchId) {
  return db.prepare('SELECT * FROM h2h_legs WHERE match_id = ? ORDER BY leg_number').all(matchId);
}

function getMatchOr404(id, res) {
  const match = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(id);
  if (!match) {
    res.status(404).json({ error: 'مسابقه یافت نشد.' });
    return null;
  }
  return match;
}

function userEmail(userId) {
  return db.prepare('SELECT email FROM users WHERE id = ?').get(userId)?.email;
}

// Aggregates both legs (two-legged tie, away-goals-free simple aggregate —
// the source spec mentions "best of three or FIFA" without pinning down one
// exact rule, so this uses a straightforward combined-score aggregate) and,
// once both legs are resolved, finalizes the match: winner, season points,
// XP for both players, and ticket payout/refund for ticket-staked matches.
function tryFinalizeMatch(matchId) {
  const legs = getLegs(matchId);
  if (legs.length < 2) return;
  if (!legs.every((leg) => ['confirmed', 'expert_resolved'].includes(leg.status))) return;

  const match = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(matchId);
  if (!match || match.status === 'completed') return;

  let creatorGoals = 0;
  let opponentGoals = 0;
  for (const leg of legs) {
    if (leg.home_user_id === match.creator_id) {
      creatorGoals += leg.final_home_score;
      opponentGoals += leg.final_away_score;
    } else {
      creatorGoals += leg.final_away_score;
      opponentGoals += leg.final_home_score;
    }
  }

  const isDraw = creatorGoals === opponentGoals;
  const winnerId = isDraw ? null : creatorGoals > opponentGoals ? match.creator_id : match.opponent_id;

  db.prepare(
    `UPDATE h2h_matches SET status = 'completed', winner_id = ?, completed_at = datetime('now') WHERE id = ?`
  ).run(winnerId, matchId);

  for (const uid of [match.creator_id, match.opponent_id]) {
    const result = isDraw ? 'draw' : uid === winnerId ? 'win' : 'loss';
    const points = RESULT_POINTS[result];

    addSeasonPoints(uid, points);
    adjustWallet(uid, 'xp', points, 'match_reward', 'h2h_match', matchId);
    db.prepare(
      `UPDATE users SET wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE id = ?`
    ).run(result === 'win' ? 1 : 0, result === 'loss' ? 1 : 0, result === 'draw' ? 1 : 0, uid);
  }

  if (match.stake_type === 'ticket') {
    if (isDraw) {
      adjustWallet(match.creator_id, 'ticket', match.stake_amount, 'match_refund', 'h2h_match', matchId);
      adjustWallet(match.opponent_id, 'ticket', match.stake_amount, 'match_refund', 'h2h_match', matchId);
    } else {
      adjustWallet(winnerId, 'ticket', match.stake_amount * 2, 'match_reward', 'h2h_match', matchId);
    }
  }

  for (const uid of [match.creator_id, match.opponent_id]) {
    const email = userEmail(uid);
    if (email) {
      sendEmailNotification(
        email,
        'نتیجه مسابقه رو-در-رو نهایی شد',
        isDraw ? 'مسابقه شما با تساوی به پایان رسید.' : uid === winnerId ? 'تبریک! شما برنده مسابقه شدید.' : 'مسابقه شما به پایان رسید.'
      );
    }
  }
}

router.get('/', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM h2h_matches WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare("SELECT * FROM h2h_matches WHERE status = 'open' ORDER BY created_at DESC").all();
  res.json({ matches: rows.map(publicMatch) });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM h2h_matches WHERE creator_id = ? OR opponent_id = ? ORDER BY created_at DESC')
    .all(req.user.id, req.user.id);
  res.json({ matches: rows.map(publicMatch) });
});

router.get('/:id', (req, res) => {
  const match = getMatchOr404(req.params.id, res);
  if (!match) return;
  res.json({ match: publicMatch(match), legs: getLegs(match.id) });
});

router.post('/', requireAuth, (req, res) => {
  const { stake_type = 'ticket', stake_amount = 1, console: consoleName, game_version, is_private, password, admin_notes } = req.body;

  if (!['ticket', 'xp'].includes(stake_type)) {
    return res.status(400).json({ error: 'نوع شرط‌بندی نامعتبر است.' });
  }
  if (stake_type === 'ticket' && (stake_amount < 1 || stake_amount > MAX_TICKET_STAKE)) {
    return res.status(400).json({ error: `تعداد تیکت باید بین ۱ تا ${MAX_TICKET_STAKE} باشد.` });
  }
  if (is_private && !password) {
    return res.status(400).json({ error: 'برای مسابقه خصوصی وارد کردن رمز عبور الزامی است.' });
  }

  const passwordHash = is_private ? bcrypt.hashSync(password, 10) : null;

  const info = db
    .prepare(
      `INSERT INTO h2h_matches (creator_id, stake_type, stake_amount, console, game_version, is_private, password_hash, admin_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      stake_type,
      stake_type === 'ticket' ? stake_amount : 0,
      consoleName || null,
      game_version || null,
      is_private ? 1 : 0,
      passwordHash,
      admin_notes || null
    );

  const match = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ match: publicMatch(match) });
});

// Joining locks the match immediately — like a reserved bus seat, once both
// players are committed no one else can take the slot. Order of checks is
// password -> ticket/balance -> join, per spec.
router.post('/:id/join', requireAuth, (req, res) => {
  const match = getMatchOr404(req.params.id, res);
  if (!match) return;

  if (match.status !== 'open') {
    return res.status(409).json({ error: 'این مسابقه دیگر برای جوین شدن باز نیست.' });
  }
  if (match.creator_id === req.user.id) {
    return res.status(400).json({ error: 'نمی‌توانید در مسابقه خودتان جوین شوید.' });
  }
  if (match.is_private) {
    const { password } = req.body;
    if (!password || !bcrypt.compareSync(password, match.password_hash)) {
      return res.status(403).json({ error: 'رمز عبور مسابقه نادرست است.' });
    }
  }

  if (match.stake_type === 'ticket') {
    if (getBalance(match.creator_id, 'ticket') < match.stake_amount) {
      return res.status(409).json({ error: 'موجودی تیکت سازنده مسابقه کافی نیست.' });
    }
    if (getBalance(req.user.id, 'ticket') < match.stake_amount) {
      return res.status(402).json({ error: 'موجودی تیکت شما کافی نیست.' });
    }
  }

  const tx = db.transaction(() => {
    if (match.stake_type === 'ticket') {
      adjustWallet(match.creator_id, 'ticket', -match.stake_amount, 'match_stake', 'h2h_match', match.id);
      adjustWallet(req.user.id, 'ticket', -match.stake_amount, 'match_stake', 'h2h_match', match.id);
    }

    db.prepare(
      `UPDATE h2h_matches SET opponent_id = ?, status = 'locked', locked_at = datetime('now') WHERE id = ?`
    ).run(req.user.id, match.id);

    db.prepare(
      `INSERT INTO h2h_legs (match_id, leg_number, home_user_id, away_user_id) VALUES (?, 1, ?, ?)`
    ).run(match.id, match.creator_id, req.user.id);
    db.prepare(
      `INSERT INTO h2h_legs (match_id, leg_number, home_user_id, away_user_id) VALUES (?, 2, ?, ?)`
    ).run(match.id, req.user.id, match.creator_id);
  });

  try {
    tx();
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({ error: 'موجودی کافی نیست.' });
    }
    throw err;
  }

  for (const uid of [match.creator_id, req.user.id]) {
    const email = userEmail(uid);
    if (email) {
      sendEmailNotification(email, 'مسابقه شما قفل شد', 'حریف شما جوین شد و مسابقه قفل شده است. اکنون می‌توانید بازی را شروع کنید.');
    }
  }

  const updated = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(match.id);
  res.json({ match: publicMatch(updated), legs: getLegs(match.id) });
});

function getLegOr404(matchId, legNumber, res) {
  const leg = db
    .prepare('SELECT * FROM h2h_legs WHERE match_id = ? AND leg_number = ?')
    .get(matchId, legNumber);
  if (!leg) {
    res.status(404).json({ error: 'نیم‌فصل مسابقه یافت نشد.' });
    return null;
  }
  return leg;
}

router.post('/:id/legs/:legNumber/submit', requireAuth, (req, res) => {
  const leg = getLegOr404(req.params.id, req.params.legNumber, res);
  if (!leg) return;

  if (![leg.home_user_id, leg.away_user_id].includes(req.user.id)) {
    return res.status(403).json({ error: 'شما در این مسابقه شرکت ندارید.' });
  }
  if (leg.status !== 'pending_submission') {
    return res.status(409).json({ error: 'نتیجه این نیم‌فصل قبلاً ثبت شده است.' });
  }

  const { home_score, away_score } = req.body;
  if (!Number.isInteger(home_score) || !Number.isInteger(away_score) || home_score < 0 || away_score < 0) {
    return res.status(400).json({ error: 'نتیجه بازی نامعتبر است.' });
  }

  db.prepare(
    `UPDATE h2h_legs SET submitted_by_id = ?, submitted_home_score = ?, submitted_away_score = ?, status = 'pending_confirmation'
     WHERE id = ?`
  ).run(req.user.id, home_score, away_score, leg.id);

  const otherUserId = req.user.id === leg.home_user_id ? leg.away_user_id : leg.home_user_id;
  const email = userEmail(otherUserId);
  if (email) {
    sendEmailNotification(email, 'نتیجه بازی برای تایید شما ثبت شد', `نتیجه ثبت‌شده: ${home_score} - ${away_score}. لطفاً تایید یا اعتراض خود را ثبت کنید.`);
  }

  res.json({ leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id) });
});

router.post('/:id/legs/:legNumber/confirm', requireAuth, (req, res) => {
  const leg = getLegOr404(req.params.id, req.params.legNumber, res);
  if (!leg) return;

  if (![leg.home_user_id, leg.away_user_id].includes(req.user.id)) {
    return res.status(403).json({ error: 'شما در این مسابقه شرکت ندارید.' });
  }
  if (leg.status !== 'pending_confirmation') {
    return res.status(409).json({ error: 'این نیم‌فصل در وضعیت قابل تایید نیست.' });
  }
  if (leg.submitted_by_id === req.user.id) {
    return res.status(400).json({ error: 'ثبت‌کننده نتیجه نمی‌تواند آن را تایید کند.' });
  }

  db.prepare(
    `UPDATE h2h_legs SET final_home_score = submitted_home_score, final_away_score = submitted_away_score,
     confirmed_by_id = ?, status = 'confirmed', resolved_at = datetime('now') WHERE id = ?`
  ).run(req.user.id, leg.id);

  tryFinalizeMatch(leg.match_id);

  res.json({
    leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id),
    match: publicMatch(db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(leg.match_id)),
  });
});

router.post('/:id/legs/:legNumber/dispute', requireAuth, (req, res) => {
  const leg = getLegOr404(req.params.id, req.params.legNumber, res);
  if (!leg) return;

  if (![leg.home_user_id, leg.away_user_id].includes(req.user.id)) {
    return res.status(403).json({ error: 'شما در این مسابقه شرکت ندارید.' });
  }
  if (leg.status !== 'pending_confirmation') {
    return res.status(409).json({ error: 'این نیم‌فصل در وضعیت قابل اعتراض نیست.' });
  }
  if (leg.submitted_by_id === req.user.id) {
    return res.status(400).json({ error: 'ثبت‌کننده نتیجه نمی‌تواند به آن اعتراض کند.' });
  }

  const { home_score, away_score, evidence } = req.body;
  if (!Number.isInteger(home_score) || !Number.isInteger(away_score)) {
    return res.status(400).json({ error: 'نتیجه پیشنهادی نامعتبر است.' });
  }

  db.prepare(
    `UPDATE h2h_legs SET dispute_home_score = ?, dispute_away_score = ?, dispute_evidence = ?, dispute_by_id = ?,
     status = 'expert_review' WHERE id = ?`
  ).run(home_score, away_score, evidence || null, req.user.id, leg.id);

  res.json({ leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id) });
});

router.get('/admin/expert-queue', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM h2h_legs WHERE status = 'expert_review' ORDER BY created_at").all();
  res.json({ legs: rows });
});

router.post('/:id/legs/:legNumber/expert-resolve', requireAuth, requireAdmin, (req, res) => {
  const leg = getLegOr404(req.params.id, req.params.legNumber, res);
  if (!leg) return;

  if (leg.status !== 'expert_review') {
    return res.status(409).json({ error: 'این نیم‌فصل در صف بررسی کارشناسی نیست.' });
  }

  const { home_score, away_score } = req.body;
  if (!Number.isInteger(home_score) || !Number.isInteger(away_score)) {
    return res.status(400).json({ error: 'نتیجه نهایی نامعتبر است.' });
  }

  db.prepare(
    `UPDATE h2h_legs SET final_home_score = ?, final_away_score = ?, expert_id = ?, is_expert_reviewed = 1,
     status = 'expert_resolved', resolved_at = datetime('now') WHERE id = ?`
  ).run(home_score, away_score, req.user.id, leg.id);

  tryFinalizeMatch(leg.match_id);

  for (const uid of [leg.home_user_id, leg.away_user_id]) {
    const email = userEmail(uid);
    if (email) {
      sendEmailNotification(email, 'نتیجه توسط کارشناس بررسی و ثبت شد', `نتیجه نهایی: ${home_score} - ${away_score}`);
    }
  }

  res.json({
    leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id),
    match: publicMatch(db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(leg.match_id)),
  });
});

export default router;
