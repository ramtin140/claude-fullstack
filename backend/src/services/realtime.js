import { Server } from 'socket.io';
import { db } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

let io = null;

// Each authenticated socket joins a private room for its user id (so a
// specific player can be pinged: challenge received, leg submitted, etc.)
// and, if staff, the shared "experts" room used for the dispute-queue badge.
export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || '*' },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) return socket.disconnect(true);

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return socket.disconnect(true);
    }

    socket.join(`user:${payload.id}`);
    if (payload.role === 'senior_admin' || payload.role === 'match_expert') {
      socket.join('experts');
      socket.emit('expert_queue:update', { count: getExpertQueueCount() });
    }
    if (payload.role === 'senior_admin') {
      socket.join('finance_admins');
      socket.emit('withdrawals:update', { count: getPendingWithdrawalsCount() });
      socket.emit('goal_clips:update', { count: getPendingGoalClipsCount() });
    }
    if (payload.role === 'senior_admin' || payload.role === 'writer') {
      socket.join('content_managers');
      socket.emit('support:update', { count: getOpenSupportCount() });
    }
  });

  return io;
}

function getExpertQueueCount() {
  return db.prepare("SELECT COUNT(*) AS c FROM h2h_legs WHERE status = 'expert_review'").get().c;
}

function getPendingWithdrawalsCount() {
  return db.prepare("SELECT COUNT(*) AS c FROM withdrawal_requests WHERE status = 'pending'").get().c;
}

function getPendingGoalClipsCount() {
  return db.prepare("SELECT COUNT(*) AS c FROM goal_clips WHERE status = 'pending'").get().c;
}

function getOpenSupportCount() {
  return db.prepare("SELECT COUNT(*) AS c FROM support_tickets WHERE status = 'open'").get().c;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitExpertQueueUpdate() {
  io?.to('experts').emit('expert_queue:update', { count: getExpertQueueCount() });
}

export function emitWithdrawalsUpdate() {
  io?.to('finance_admins').emit('withdrawals:update', { count: getPendingWithdrawalsCount() });
}

export function emitGoalClipsUpdate() {
  io?.to('finance_admins').emit('goal_clips:update', { count: getPendingGoalClipsCount() });
}

export function emitSupportUpdate() {
  io?.to('content_managers').emit('support:update', { count: getOpenSupportCount() });
}
