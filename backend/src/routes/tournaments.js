import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

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
    .prepare('SELECT * FROM matches WHERE tournament_id = ? ORDER BY scheduled_at')
    .all(req.params.id);

  res.json({ tournament, participants, matches });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, type, description, status, entry_fee, max_players, start_date } = req.body;
  if (!title) return res.status(400).json({ error: 'عنوان تورنمنت الزامی است.' });

  const info = db
    .prepare(
      `INSERT INTO tournaments (title, type, description, status, entry_fee, max_players, start_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      type || 'league',
      description || '',
      status || 'upcoming',
      entry_fee || 0,
      max_players || 16,
      start_date || null,
      req.user.id
    );

  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ tournament });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'تورنمنت یافت نشد.' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE tournaments SET title = ?, type = ?, description = ?, status = ?, entry_fee = ?, max_players = ?, start_date = ?
     WHERE id = ?`
  ).run(
    merged.title,
    merged.type,
    merged.description,
    merged.status,
    merged.entry_fee,
    merged.max_players,
    merged.start_date,
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

export default router;
