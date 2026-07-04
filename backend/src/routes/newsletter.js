import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.post('/', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^0?9\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'شماره موبایل معتبر وارد کنید.' });
  }
  try {
    db.prepare('INSERT INTO newsletter_subscribers (phone) VALUES (?)').run(phone);
  } catch {
    return res.status(409).json({ error: 'این شماره قبلاً ثبت شده است.' });
  }
  res.status(201).json({ subscribed: true });
});

export default router;
