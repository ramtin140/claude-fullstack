import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: only active options, grouped by category — used to populate
// dropdowns (console, game version) on match/tournament creation forms.
router.get('/', (req, res) => {
  const { category } = req.query;
  const rows = category
    ? db
        .prepare('SELECT * FROM game_options WHERE category = ? AND is_active = 1 ORDER BY sort_order, id')
        .all(category)
    : db.prepare('SELECT * FROM game_options WHERE is_active = 1 ORDER BY category, sort_order, id').all();
  res.json({ options: rows });
});

// Admin: full list including inactive ones, for the management screen.
router.get('/admin', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM game_options ORDER BY category, sort_order, id').all();
  res.json({ options: rows });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { category, value, label, sort_order } = req.body;
  if (!['console', 'game_version'].includes(category) || !value || !label) {
    return res.status(400).json({ error: 'دسته، مقدار و برچسب الزامی است.' });
  }
  try {
    const info = db
      .prepare('INSERT INTO game_options (category, value, label, sort_order) VALUES (?, ?, ?, ?)')
      .run(category, value, label, sort_order || 0);
    res.status(201).json({ option: db.prepare('SELECT * FROM game_options WHERE id = ?').get(info.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: 'این گزینه قبلاً در این دسته وجود دارد.' });
  }
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM game_options WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'گزینه یافت نشد.' });

  const merged = { ...existing, ...req.body };
  db.prepare('UPDATE game_options SET label = ?, is_active = ?, sort_order = ? WHERE id = ?').run(
    merged.label,
    merged.is_active ? 1 : 0,
    merged.sort_order,
    req.params.id
  );
  res.json({ option: db.prepare('SELECT * FROM game_options WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM game_options WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
