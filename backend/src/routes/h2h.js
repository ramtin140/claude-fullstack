import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { requireAuth, requireMatchExpert } from '../middleware/auth.js';
import { adjustWallet, getBalance } from '../services/wallet.js';
import { addSeasonPoints, RESULT_POINTS } from '../services/grading.js';
import { sendEmailNotification } from '../services/notify.js';
import { uploadEvidence, publicEvidenceUrl } from '../middleware/upload.js';
import { emitExpertQueueUpdate } from '../services/realtime.js';
import { notifyUser } from '../services/notifications.js';

const router = Router();

const MAX_TICKET_STAKE = 5;

function publicMatch(match) {
  const { password_hash, ...rest } = match;
  return { ...rest, is_private: Boolean(rest.is_private), has_password: Boolean(password_hash) };
}

function getSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

// Attaches opponent name/avatar/fifa_soul_id to each leg so the submit/confirm
// UI can show "شما در برابر: [عکس] [نام] [FS-xxxx]" instead of bare,
// easily-swapped score inputs. is_expert_reviewed is also normalized here —
// it's an INTEGER 0/1 column and "0 && <Jsx/>" would otherwise render the
// literal text "0" in the leg card.
function withUserInfo(legs) {
  if (legs.length === 0) return legs;
  const ids = [...new Set(legs.flatMap((l) => [l.home_user_id, l.away_user_id]))];
  const placeholders = ids.map(() => '?').join(',');
  const users = db.prepare(`SELECT id, name, avatar_url, fifa_soul_id FROM users WHERE id IN (${placeholders})`).all(...ids);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return legs.map((leg) => ({
    ...leg,
    is_expert_reviewed: Boolean(leg.is_expert_reviewed),
    home_user_name: byId[leg.home_user_id]?.name || null,
    home_user_avatar: byId[leg.home_user_id]?.avatar_url || null,
    home_user_fifa_soul_id: byId[leg.home_user_id]?.fifa_soul_id || null,
    away_user_name: byId[leg.away_user_id]?.name || null,
    away_user_avatar: byId[leg.away_user_id]?.avatar_url || null,
    away_user_fifa_soul_id: byId[leg.away_user_id]?.fifa_soul_id || null,
  }));
}

function getLegs(matchId) {
  return withUserInfo(db.prepare('SELECT * FROM h2h_legs WHERE match_id = ? ORDER BY leg_number').all(matchId));
}

// Attaches creator/opponent name+avatar to match listing rows so "مسابقات
// من" can show who's actually in each match instead of bare stake/console
// info with no opponent context.
function withMatchUserInfo(matches) {
  if (matches.length === 0) return matches;
  const ids = [...new Set(matches.flatMap((m) => [m.creator_id, m.opponent_id]).filter(Boolean))];
  const placeholders = ids.map(() => '?').join(',');
  const users = db.prepare(`SELECT id, name, avatar_url FROM users WHERE id IN (${placeholders})`).all(...ids);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return matches.map((m) => ({
    ...m,
    creator_name: byId[m.creator_id]?.name || null,
    creator_avatar: byId[m.creator_id]?.avatar_url || null,
    opponent_name: m.opponent_id ? byId[m.opponent_id]?.name || null : null,
    opponent_avatar: m.opponent_id ? byId[m.opponent_id]?.avatar_url || null : null,
  }));
}

// Lazy "cron replacement": a forfeited leg sits in a grace period where the
// losing side can dispute it; once forfeit_dispute_deadline passes with no
// dispute, the 3-0 result becomes final. Checked whenever a match is viewed.
function maybeFinalizeForfeits(matchId) {
  const expired = db
    .prepare(
      `SELECT * FROM h2h_legs WHERE match_id = ? AND status = 'forfeited' AND forfeit_dispute_deadline IS NOT NULL AND forfeit_dispute_deadline <= datetime('now')`
    )
    .all(matchId);
  for (const leg of expired) {
    db.prepare(`UPDATE h2h_legs SET status = 'confirmed', resolved_at = datetime('now') WHERE id = ?`).run(leg.id);
  }
  if (expired.length) tryFinalizeMatch(matchId);
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
    const message = isDraw ? 'مسابقه رو-در-رو شما با تساوی به پایان رسید.' : uid === winnerId ? 'تبریک! شما برنده مسابقه شدید 🎉' : 'مسابقه رو-در-رو شما به پایان رسید.';
    const email = userEmail(uid);
    if (email) sendEmailNotification(email, 'نتیجه مسابقه رو-در-رو نهایی شد', message);
    notifyUser(uid, message, isDraw ? 'info' : uid === winnerId ? 'success' : 'info', `/h2h/${matchId}`);
  }
}

router.get('/', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM h2h_matches WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare("SELECT * FROM h2h_matches WHERE status = 'open' ORDER BY created_at DESC").all();
  res.json({ matches: withMatchUserInfo(rows).map(publicMatch) });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM h2h_matches WHERE creator_id = ? OR opponent_id = ? ORDER BY created_at DESC')
    .all(req.user.id, req.user.id);
  res.json({ matches: withMatchUserInfo(rows).map(publicMatch) });
});

router.get('/:id', (req, res) => {
  const match = getMatchOr404(req.params.id, res);
  if (!match) return;
  maybeFinalizeForfeits(match.id);
  const refreshed = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(match.id);
  res.json({ match: publicMatch(refreshed), legs: getLegs(match.id) });
});

router.post('/', requireAuth, (req, res) => {
  const { stake_type = 'ticket', stake_amount = 1, console: consoleName, game_version, is_private, password, admin_notes, time_limit_hours } = req.body;

  if (!['ticket', 'xp'].includes(stake_type)) {
    return res.status(400).json({ error: 'نوع شرط‌بندی نامعتبر است.' });
  }
  if (stake_type === 'ticket' && (stake_amount < 1 || stake_amount > MAX_TICKET_STAKE)) {
    return res.status(400).json({ error: `تعداد تیکت باید بین ۱ تا ${MAX_TICKET_STAKE} باشد.` });
  }
  if (is_private && !password) {
    return res.status(400).json({ error: 'برای مسابقه خصوصی وارد کردن رمز عبور الزامی است.' });
  }
  if (time_limit_hours !== undefined && time_limit_hours !== null && time_limit_hours !== '' && (!Number.isInteger(Number(time_limit_hours)) || Number(time_limit_hours) < 1)) {
    return res.status(400).json({ error: 'فرجه زمانی نامعتبر است.' });
  }

  const passwordHash = is_private ? bcrypt.hashSync(password, 10) : null;

  const info = db
    .prepare(
      `INSERT INTO h2h_matches (creator_id, stake_type, stake_amount, console, game_version, is_private, password_hash, admin_notes, time_limit_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      stake_type,
      stake_type === 'ticket' ? stake_amount : 0,
      consoleName || null,
      game_version || null,
      is_private ? 1 : 0,
      passwordHash,
      admin_notes || null,
      time_limit_hours ? Number(time_limit_hours) : null
    );

  const match = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ match: publicMatch(match) });
});

// Expert/admin override of the play-time-limit — can be set before or after
// the match locks; if legs already exist their deadline is recomputed from
// locked_at, matching "یا از سمت کارشناس یا مدت زمان انجام بازی".
router.put('/:id/time-limit', requireAuth, requireMatchExpert, (req, res) => {
  const match = getMatchOr404(req.params.id, res);
  if (!match) return;

  const hours = Number(req.body.time_limit_hours);
  if (!Number.isInteger(hours) || hours < 1) {
    return res.status(400).json({ error: 'فرجه زمانی نامعتبر است.' });
  }

  db.prepare('UPDATE h2h_matches SET time_limit_hours = ? WHERE id = ?').run(hours, match.id);

  if (match.locked_at) {
    db.prepare(
      `UPDATE h2h_legs SET deadline_at = datetime(?, '+' || ? || ' hours') WHERE match_id = ? AND status = 'pending_submission'`
    ).run(match.locked_at, hours, match.id);
  }

  const updated = db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(match.id);
  res.json({ match: publicMatch(updated), legs: getLegs(match.id) });
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

  const timeLimitHours = match.time_limit_hours || Number(getSetting('h2h_default_time_limit_hours', '24'));

  const tx = db.transaction(() => {
    if (match.stake_type === 'ticket') {
      adjustWallet(match.creator_id, 'ticket', -match.stake_amount, 'match_stake', 'h2h_match', match.id);
      adjustWallet(req.user.id, 'ticket', -match.stake_amount, 'match_stake', 'h2h_match', match.id);
    }

    db.prepare(
      `UPDATE h2h_matches SET opponent_id = ?, status = 'locked', locked_at = datetime('now'), time_limit_hours = COALESCE(time_limit_hours, ?) WHERE id = ?`
    ).run(req.user.id, timeLimitHours, match.id);

    db.prepare(
      `INSERT INTO h2h_legs (match_id, leg_number, home_user_id, away_user_id, deadline_at)
       VALUES (?, 1, ?, ?, datetime('now', '+' || ? || ' hours'))`
    ).run(match.id, match.creator_id, req.user.id, timeLimitHours);
    db.prepare(
      `INSERT INTO h2h_legs (match_id, leg_number, home_user_id, away_user_id, deadline_at)
       VALUES (?, 2, ?, ?, datetime('now', '+' || ? || ' hours'))`
    ).run(match.id, req.user.id, match.creator_id, timeLimitHours);
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
    notifyUser(uid, 'حریف جوین شد و مسابقه قفل شد — می‌توانید بازی را شروع کنید.', 'success', `/h2h/${match.id}`);
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
  notifyUser(otherUserId, `نتیجه نیم‌فصل ${leg.leg_number} ثبت شد — منتظر تایید شماست.`, 'info', `/h2h/${leg.match_id}`);

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

  notifyUser(leg.submitted_by_id, `نتیجه ثبت‌شده شما برای نیم‌فصل ${leg.leg_number} تایید شد.`, 'success', `/h2h/${leg.match_id}`);

  tryFinalizeMatch(leg.match_id);

  res.json({
    leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id),
    match: publicMatch(db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(leg.match_id)),
  });
});

// multipart/form-data: fields arrive as strings, an optional evidence_file
// upload arrives as req.file — "عکس از مستندات بازی برای کارشناس می‌فرستد".
router.post('/:id/legs/:legNumber/dispute', requireAuth, (req, res) => {
  uploadEvidence(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

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

    const home_score = Number(req.body.home_score);
    const away_score = Number(req.body.away_score);
    if (!Number.isInteger(home_score) || !Number.isInteger(away_score)) {
      return res.status(400).json({ error: 'نتیجه پیشنهادی نامعتبر است.' });
    }

    const noteParts = [];
    if (req.body.evidence) noteParts.push(req.body.evidence);
    if (req.file) noteParts.push(publicEvidenceUrl(req.file.filename));
    const evidence = noteParts.join(' | ') || null;

    db.prepare(
      `UPDATE h2h_legs SET dispute_home_score = ?, dispute_away_score = ?, dispute_evidence = ?, dispute_by_id = ?,
       status = 'expert_review' WHERE id = ?`
    ).run(home_score, away_score, evidence, req.user.id, leg.id);

    notifyUser(leg.submitted_by_id, `به نتیجه ثبت‌شده شما در نیم‌فصل ${leg.leg_number} اعتراض شد.`, 'warning', `/h2h/${leg.match_id}`);
    emitExpertQueueUpdate();

    res.json({ leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id) });
  });
});

// "اگر طرف ثبت نکرد نتیجه ۳ بر صفر بشه" — once the play-time deadline has
// passed with no submission, either participant can claim a 3-0 walkover.
// The claimed result is not final immediately: it opens a short grace period
// (forfeit_dispute_deadline) during which the losing side can dispute it —
// see /dispute-forfeit below. maybeFinalizeForfeits() promotes it to a real
// confirmed result once that window lapses without a dispute.
router.post('/:id/legs/:legNumber/claim-forfeit', requireAuth, (req, res) => {
  const leg = getLegOr404(req.params.id, req.params.legNumber, res);
  if (!leg) return;

  if (![leg.home_user_id, leg.away_user_id].includes(req.user.id)) {
    return res.status(403).json({ error: 'شما در این مسابقه شرکت ندارید.' });
  }
  if (leg.status !== 'pending_submission') {
    return res.status(409).json({ error: 'این نیم‌فصل در وضعیت قابل درخواست فرجه نیست.' });
  }
  if (!leg.deadline_at || leg.deadline_at > db.prepare("SELECT datetime('now') AS n").get().n) {
    return res.status(409).json({ error: 'فرجه زمانی این نیم‌فصل هنوز تمام نشده است.' });
  }

  const claimantIsHome = req.user.id === leg.home_user_id;
  const disputeWindowHours = Number(getSetting('h2h_forfeit_dispute_window_hours', '1'));

  db.prepare(
    `UPDATE h2h_legs SET final_home_score = ?, final_away_score = ?, status = 'forfeited',
     forfeit_dispute_deadline = datetime('now', '+' || ? || ' hours') WHERE id = ?`
  ).run(claimantIsHome ? 3 : 0, claimantIsHome ? 0 : 3, disputeWindowHours, leg.id);

  const loserId = claimantIsHome ? leg.away_user_id : leg.home_user_id;
  const email = userEmail(loserId);
  if (email) {
    sendEmailNotification(
      email,
      'نتیجه فرجه‌ای ثبت شد',
      `چون نتیجه در فرجه تعیین‌شده ثبت نشد، نتیجه ۳-۰ به نفع حریف ثبت شد. تا ${disputeWindowHours} ساعت فرصت اعتراض دارید.`
    );
  }
  notifyUser(
    loserId,
    `چون به‌موقع نتیجه ثبت نشد، نیم‌فصل ${leg.leg_number} به‌صورت فرجه‌ای ۳-۰ ثبت شد.`,
    'warning',
    `/h2h/${leg.match_id}`
  );

  res.json({ leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id) });
});

// Only the forfeited (losing) side may dispute, and only within the grace
// window — escalates into the same expert_review queue as a normal dispute.
router.post('/:id/legs/:legNumber/dispute-forfeit', requireAuth, (req, res) => {
  uploadEvidence(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const leg = getLegOr404(req.params.id, req.params.legNumber, res);
    if (!leg) return;

    if (![leg.home_user_id, leg.away_user_id].includes(req.user.id)) {
      return res.status(403).json({ error: 'شما در این مسابقه شرکت ندارید.' });
    }
    if (leg.status !== 'forfeited') {
      return res.status(409).json({ error: 'این نیم‌فصل نتیجه فرجه‌ای ندارد.' });
    }
    const forfeitWinnerId = leg.final_home_score === 3 ? leg.home_user_id : leg.away_user_id;
    if (req.user.id === forfeitWinnerId) {
      return res.status(400).json({ error: 'فقط طرف بازنده فرجه می‌تواند اعتراض کند.' });
    }
    if (!leg.forfeit_dispute_deadline || leg.forfeit_dispute_deadline <= db.prepare("SELECT datetime('now') AS n").get().n) {
      return res.status(409).json({ error: 'فرصت اعتراض به نتیجه فرجه‌ای تمام شده است.' });
    }

    const home_score = req.body.home_score !== undefined ? Number(req.body.home_score) : leg.final_away_score;
    const away_score = req.body.away_score !== undefined ? Number(req.body.away_score) : leg.final_home_score;

    const noteParts = ['اعتراض به نتیجه فرجه‌ای'];
    if (req.body.evidence) noteParts.push(req.body.evidence);
    if (req.file) noteParts.push(publicEvidenceUrl(req.file.filename));
    const evidence = noteParts.join(' | ');

    db.prepare(
      `UPDATE h2h_legs SET dispute_home_score = ?, dispute_away_score = ?, dispute_evidence = ?, dispute_by_id = ?,
       status = 'expert_review' WHERE id = ?`
    ).run(home_score, away_score, evidence, req.user.id, leg.id);

    emitExpertQueueUpdate();

    res.json({ leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id) });
  });
});

router.get('/admin/expert-queue', requireAuth, requireMatchExpert, (req, res) => {
  const rows = db.prepare("SELECT * FROM h2h_legs WHERE status = 'expert_review' ORDER BY created_at").all();
  res.json({ legs: withUserInfo(rows) });
});

// "کارشناسی میتونه چند قسمت داشته باشه یا پشت سر هم" — every decision is
// appended to h2h_expert_reviews so re-reviews or a second expert's opinion
// are all visible in the trail, even though the leg's own final_* fields
// (and thus the payout) only reflect the latest decision.
router.get('/legs/:legId/reviews', requireAuth, requireMatchExpert, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, u.name AS expert_name FROM h2h_expert_reviews r
       JOIN users u ON u.id = r.expert_id WHERE r.leg_id = ? ORDER BY r.created_at`
    )
    .all(req.params.legId);
  res.json({ reviews: rows });
});

router.post('/:id/legs/:legNumber/expert-resolve', requireAuth, requireMatchExpert, (req, res) => {
  const leg = getLegOr404(req.params.id, req.params.legNumber, res);
  if (!leg) return;

  if (leg.status !== 'expert_review') {
    return res.status(409).json({ error: 'این نیم‌فصل در صف بررسی کارشناسی نیست.' });
  }

  const { home_score, away_score, notes } = req.body;
  if (!Number.isInteger(home_score) || !Number.isInteger(away_score)) {
    return res.status(400).json({ error: 'نتیجه نهایی نامعتبر است.' });
  }

  db.prepare(
    `UPDATE h2h_legs SET final_home_score = ?, final_away_score = ?, expert_id = ?, is_expert_reviewed = 1,
     status = 'expert_resolved', resolved_at = datetime('now') WHERE id = ?`
  ).run(home_score, away_score, req.user.id, leg.id);

  db.prepare(
    `INSERT INTO h2h_expert_reviews (leg_id, expert_id, home_score, away_score, notes) VALUES (?, ?, ?, ?, ?)`
  ).run(leg.id, req.user.id, home_score, away_score, notes || null);

  emitExpertQueueUpdate();

  tryFinalizeMatch(leg.match_id);

  for (const uid of [leg.home_user_id, leg.away_user_id]) {
    const email = userEmail(uid);
    if (email) {
      sendEmailNotification(email, 'نتیجه توسط کارشناس بررسی و ثبت شد', `نتیجه نهایی: ${home_score} - ${away_score}`);
    }
    notifyUser(uid, `کارشناس نتیجه نیم‌فصل ${leg.leg_number} را ${home_score}-${away_score} اعلام کرد.`, 'info', `/h2h/${leg.match_id}`);
  }

  res.json({
    leg: db.prepare('SELECT * FROM h2h_legs WHERE id = ?').get(leg.id),
    match: publicMatch(db.prepare('SELECT * FROM h2h_matches WHERE id = ?').get(leg.match_id)),
  });
});

export default router;
