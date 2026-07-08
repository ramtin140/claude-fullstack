import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { notifyUser } from '../services/notifications.js';

const router = Router();

function generateDiscountCode() {
  return `GOAL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM goal_clips WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ clips: rows });
});

router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db
        .prepare(
          `SELECT g.*, u.name AS user_name FROM goal_clips g JOIN users u ON u.id = g.user_id
           WHERE g.status = ? ORDER BY g.created_at DESC`
        )
        .all(status)
    : db.prepare(`SELECT g.*, u.name AS user_name FROM goal_clips g JOIN users u ON u.id = g.user_id ORDER BY g.created_at DESC`).all();
  res.json({ clips: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { clip_url, description } = req.body;
  if (!clip_url || !clip_url.trim()) {
    return res.status(400).json({ error: 'لینک کلیپ الزامی است.' });
  }
  try {
    new URL(clip_url);
  } catch {
    return res.status(400).json({ error: 'لینک کلیپ نامعتبر است.' });
  }

  const info = db
    .prepare('INSERT INTO goal_clips (user_id, clip_url, description) VALUES (?, ?, ?)')
    .run(req.user.id, clip_url.trim(), description || null);

  res.status(201).json({ clip: db.prepare('SELECT * FROM goal_clips WHERE id = ?').get(info.lastInsertRowid) });
});

router.post('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  const clip = db.prepare('SELECT * FROM goal_clips WHERE id = ?').get(req.params.id);
  if (!clip) return res.status(404).json({ error: 'کلیپ یافت نشد.' });
  if (clip.status !== 'pending') return res.status(409).json({ error: 'این کلیپ قبلاً بررسی شده است.' });

  const code = generateDiscountCode();
  db.prepare(
    `UPDATE goal_clips SET status = 'approved', discount_code = ?, resolved_at = datetime('now') WHERE id = ?`
  ).run(code, clip.id);

  notifyUser(clip.user_id, `کلیپ گل شما تایید شد! کد تخفیف شما: ${code}`, 'success', '/goal-clips');

  res.json({ clip: db.prepare('SELECT * FROM goal_clips WHERE id = ?').get(clip.id) });
});

router.post('/:id/reject', requireAuth, requireAdmin, (req, res) => {
  const clip = db.prepare('SELECT * FROM goal_clips WHERE id = ?').get(req.params.id);
  if (!clip) return res.status(404).json({ error: 'کلیپ یافت نشد.' });
  if (clip.status !== 'pending') return res.status(409).json({ error: 'این کلیپ قبلاً بررسی شده است.' });

  db.prepare(
    `UPDATE goal_clips SET status = 'rejected', admin_notes = ?, resolved_at = datetime('now') WHERE id = ?`
  ).run(req.body.admin_notes || null, clip.id);

  notifyUser(clip.user_id, 'متأسفانه کلیپ گل شما تایید نشد.', 'warning', '/goal-clips');

  res.json({ clip: db.prepare('SELECT * FROM goal_clips WHERE id = ?').get(clip.id) });
});

export default router;
