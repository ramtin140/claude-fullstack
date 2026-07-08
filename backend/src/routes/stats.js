import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const ro_dero = db
    .prepare("SELECT COUNT(*) AS c FROM matches WHERE category = 'ro_dero'")
    .get().c;
  const play_off = db
    .prepare("SELECT COUNT(*) AS c FROM matches WHERE category = 'play_off'")
    .get().c;
  const leagues = db.prepare("SELECT COUNT(*) AS c FROM tournaments WHERE type = 'league'").get().c;
  const cups = db.prepare("SELECT COUNT(*) AS c FROM tournaments WHERE type = 'cup'").get().c;
  const members = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'member'").get().c;

  res.json({
    stats: {
      ro_dero,
      play_off,
      leagues,
      cups,
      members,
    },
  });
});

router.get('/leaderboard', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, points, wins, losses FROM users WHERE role = ? ORDER BY points DESC LIMIT 10')
    .all('member');
  res.json({ leaderboard: rows });
});

export default router;
