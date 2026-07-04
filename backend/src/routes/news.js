import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const { category } = req.query;
  const rows = category
    ? db.prepare('SELECT * FROM news WHERE category = ? ORDER BY published_at DESC').all(category)
    : db.prepare('SELECT * FROM news ORDER BY published_at DESC').all();
  res.json({ news: rows });
});

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'خبر یافت نشد.' });
  res.json({ news: item });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, excerpt, body, cover_image, category } = req.body;
  if (!title) return res.status(400).json({ error: 'عنوان خبر الزامی است.' });

  const info = db
    .prepare(
      `INSERT INTO news (title, excerpt, body, cover_image, category, author_id) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, excerpt || '', body || '', cover_image || null, category || 'general', req.user.id);

  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ news: item });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'خبر یافت نشد.' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE news SET title = ?, excerpt = ?, body = ?, cover_image = ?, category = ? WHERE id = ?`
  ).run(merged.title, merged.excerpt, merged.body, merged.cover_image, merged.category, req.params.id);

  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  res.json({ news: item });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
