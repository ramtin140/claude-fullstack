import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'node:http';

import './db/index.js';
import './db/seed.js';
import { uploadsDir } from './middleware/upload.js';
import { initRealtime } from './services/realtime.js';

import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournaments.js';
import matchRoutes from './routes/matches.js';
import newsRoutes from './routes/news.js';
import statsRoutes from './routes/stats.js';
import usersRoutes from './routes/users.js';
import newsletterRoutes from './routes/newsletter.js';
import h2hRoutes from './routes/h2h.js';
import walletRoutes from './routes/wallet.js';
import adminEconomyRoutes from './routes/admin-economy.js';
import gameOptionsRoutes from './routes/game-options.js';
import challengesRoutes from './routes/challenges.js';
import notificationsRoutes from './routes/notifications.js';
import messagesRoutes from './routes/messages.js';
import supportRoutes from './routes/support.js';
import withdrawalsRoutes from './routes/withdrawals.js';
import goalClipsRoutes from './routes/goal-clips.js';
import paymentMethodsRoutes from './routes/payment-methods.js';
import depositsRoutes from './routes/deposits.js';
import contactRoutes from './routes/contact.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Two-service deployment: the frontend is a separate Railway service and
// calls this API cross-origin, so it must be explicitly allowed here. In
// local dev FRONTEND_URL is typically unset — Vite's dev-server proxy makes
// requests same-origin from the browser's point of view, so CORS doesn't
// come into play, and falling back to "*" keeps that working unchanged.
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/h2h', h2hRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminEconomyRoutes);
app.use('/api/game-options', gameOptionsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/goal-clips', goalClipsRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/deposits', depositsRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res) => res.status(404).json({ error: 'مسیر یافت نشد.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای داخلی سرور.' });
});

const httpServer = createServer(app);
initRealtime(httpServer);

httpServer.listen(PORT, () => {
  console.log(`FIFA Soul API running on http://localhost:${PORT}`);
});
