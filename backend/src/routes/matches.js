import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { advanceWinner } from '../services/bracket.js';

const router = Router();

// Bracket-generated matches only carry home_user_id/away_user_id (no free-text
// home_name/away_name), so resolve display names via a LEFT JOIN — this is
// the one place the frontend needs to look, rather than every consumer
// having to separately fetch users to fill in "؟" placeholders.
const SELECT_WITH_NAMES = `
  SELECT m.*,
         hu.name AS home_user_name,
         au.name AS away_user_name
  FROM matches m
  LEFT JOIN users hu ON hu.id = m.home_user_id
  LEFT JOIN users au ON au.id = m.away_user_id
`;

router.get('/', (req, res) => {
  const { status, category } = req.query;
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push('m.status = ?');
    params.push(status);
  }
  if (category) {
    clauses.push('m.category = ?');
    params.push(category);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`${SELECT_WITH_NAMES} ${where} ORDER BY m.created_at DESC`)
    .all(...params);
  res.json({ matches: rows });
});

router.get('/:id', (req, res) => {
  const match = db.prepare(`${SELECT_WITH_NAMES} WHERE m.id = ?`).get(req.params.id);
  if (!match) return res.status(404).json({ error: 'مسابقه یافت نشد.' });
  res.json({ match });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const {
    tournament_id,
    home_name,
    away_name,
    home_user_id,
    away_user_id,
    status,
    category,
    scheduled_at,
  } = req.body;

  const info = db
    .prepare(
      `INSERT INTO matches (tournament_id, home_user_id, away_user_id, home_name, away_name, status, category, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      tournament_id || null,
      home_user_id || null,
      away_user_id || null,
      home_name || null,
      away_name || null,
      status || 'waiting',
      category || 'ro_dero',
      scheduled_at || null
    );

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ match });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'مسابقه یافت نشد.' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE matches SET home_name = ?, away_name = ?, home_score = ?, away_score = ?, status = ?, category = ?, scheduled_at = ?
     WHERE id = ?`
  ).run(
    merged.home_name,
    merged.away_name,
    merged.home_score,
    merged.away_score,
    merged.status,
    merged.category,
    merged.scheduled_at,
    req.params.id
  );

  if (merged.status === 'finished' && merged.home_score != null && merged.away_score != null) {
    advanceWinner(req.params.id);
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  res.json({ match });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM matches WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
