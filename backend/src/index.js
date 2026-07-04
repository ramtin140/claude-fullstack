import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './db/index.js';
import './db/seed.js';

import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournaments.js';
import matchRoutes from './routes/matches.js';
import newsRoutes from './routes/news.js';
import statsRoutes from './routes/stats.js';
import usersRoutes from './routes/users.js';
import newsletterRoutes from './routes/newsletter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/newsletter', newsletterRoutes);

// In production the frontend is built into frontend/dist and served from
// this same service (single-service deployment, e.g. Railway). Locally,
// frontend/dist doesn't exist because the frontend runs on its own dev
// server (:5173), so this block is simply skipped.
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: 'مسیر یافت نشد.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای داخلی سرور.' });
});

app.listen(PORT, () => {
  console.log(`FIFA Soul API running on http://localhost:${PORT}`);
});
