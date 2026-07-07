import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateCupBracket, generatePlayoffBracket, generateLeagueSchedule, computeStandings } from '../services/bracket.js';

const router = Router();

const VALID_TYPES = ['league', 'cup', 'playoff'];
const VALID_CUP_SIZES = [4, 8, 16];

router.get('/', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db
      .prepare('SELECT * FROM tournaments WHERE status = ? ORDER BY created_at DESC')
      .all(status);
  } else {
    rows = db.prepare('SELECT * FROM tournaments ORDER BY created_at DESC').all();
  }
  const withCounts = rows.map((t) => ({
    ...t,
    participant_count: db
      .prepare('SELECT COUNT(*) AS c FROM tournament_participants WHERE tournament_id = ?')
      .get(t.id).c,
  }));
  res.json({ tournaments: withCounts });
});

router.get('/:id', (req, res) => {
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'تورنمنت یافت نشد.' });

  const participants = db
    .prepare(
      `SELECT u.id, u.name, u.points FROM tournament_participants tp
       JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ?`
    )
    .all(req.params.id);

  const matches = db
    .prepare(
      `SELECT m.*, hu.name AS home_user_name, au.name AS away_user_name
       FROM matches m
       LEFT JOIN users hu ON hu.id = m.home_user_id
       LEFT JOIN users au ON au.id = m.away_user_id
       WHERE m.tournament_id = ? ORDER BY m.round, m.bracket_slot, m.scheduled_at`
    )
    .all(req.params.id);

  const standings = tournament.type === 'league' && tournament.bracket_generated ? computeStandings(tournament.id) : null;

  res.json({ tournament, participants, matches, standings });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, type, description, status, entry_fee, max_players, start_date, bracket_size } = req.body;
  if (!title) return res.status(400).json({ error: 'عنوان تورنمنت الزامی است.' });
  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'نوع تورنمنت نامعتبر است.' });
  }
  if ((type || 'league') === 'cup' && bracket_size && !VALID_CUP_SIZES.includes(Number(bracket_size))) {
    return res.status(400).json({ error: 'اندازه کاپ باید یکی از ۴، ۸ یا ۱۶ باشد.' });
  }

  const info = db
    .prepare(
      `INSERT INTO tournaments (title, type, description, status, entry_fee, max_players, start_date, created_by, bracket_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      type || 'league',
      description || '',
      status || 'upcoming',
      entry_fee || 0,
      max_players || 16,
      start_date || null,
      req.user.id,
      bracket_size || null
    );

  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ tournament });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'تورنمنت یافت نشد.' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE tournaments SET title = ?, type = ?, description = ?, status = ?, entry_fee = ?, max_players = ?, start_date = ?, bracket_size = ?
     WHERE id = ?`
  ).run(
    merged.title,
    merged.type,
    merged.description,
    merged.status,
    merged.entry_fee,
    merged.max_players,
    merged.start_date,
    merged.bracket_size,
    req.params.id
  );

  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  res.json({ tournament });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM tournaments WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

router.post('/:id/join', requireAuth, (req, res) => {
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'تورنمنت یافت نشد.' });
  if (tournament.bracket_generated) {
    return res.status(409).json({ error: 'مسابقات این تورنمنت شروع شده و دیگر امکان ثبت‌نام نیست.' });
  }

  try {
    db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)').run(
      req.params.id,
      req.user.id
    );
  } catch {
    return res.status(409).json({ error: 'شما قبلاً در این تورنمنت ثبت‌نام کرده‌اید.' });
  }
  res.status(201).json({ joined: true });
});

// Builds the bracket/schedule once enough participants have joined —
// cup: exact bracket_size (4/8/16); playoff: any count (random byes);
// league: any count (round-robin schedule). Idempotent guard via
// bracket_generated so it can't be run twice and duplicate matches.
router.post('/:id/generate-bracket', requireAuth, requireAdmin, (req, res) => {
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'تورنمنت یافت نشد.' });
  if (tournament.bracket_generated) {
    return res.status(409).json({ error: 'برای این تورنمنت قبلاً برکت/جدول ساخته شده است.' });
  }

  const participants = db
    .prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?')
    .all(tournament.id)
    .map((p) => p.user_id);

  if (tournament.type === 'cup') {
    if (!tournament.bracket_size) {
      return res.status(400).json({ error: 'اندازه کاپ برای این تورنمنت تنظیم نشده است.' });
    }
    if (participants.length !== tournament.bracket_size) {
      return res
        .status(409)
        .json({ error: `برای شروع کاپ دقیقاً ${tournament.bracket_size} شرکت‌کننده لازم است (الان ${participants.length} نفر).` });
    }
    generateCupBracket(tournament.id, participants);
  } else if (tournament.type === 'playoff') {
    if (participants.length < 2) {
      return res.status(409).json({ error: 'حداقل ۲ شرکت‌کننده برای پلی‌آف لازم است.' });
    }
    generatePlayoffBracket(tournament.id, participants);
  } else {
    if (participants.length < 2) {
      return res.status(409).json({ error: 'حداقل ۲ شرکت‌کننده برای لیگ لازم است.' });
    }
    generateLeagueSchedule(tournament.id, participants);
  }

  db.prepare('UPDATE tournaments SET bracket_generated = 1, status = ? WHERE id = ?').run('in_progress', tournament.id);

  const matches = db
    .prepare('SELECT * FROM matches WHERE tournament_id = ? ORDER BY round, bracket_slot')
    .all(tournament.id);
  res.status(201).json({ matches });
});

export default router;
