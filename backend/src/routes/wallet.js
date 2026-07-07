import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { listTransactions } from '../services/wallet.js';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT ticket_balance, xp, season_points, grade FROM users WHERE id = ?')
    .get(req.user.id);
  res.json({
    wallet: user,
    transactions: listTransactions(req.user.id, 50),
  });
});

export default router;
