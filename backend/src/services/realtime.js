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
  });

  return io;
}

function getExpertQueueCount() {
  return db.prepare("SELECT COUNT(*) AS c FROM h2h_legs WHERE status = 'expert_review'").get().c;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitExpertQueueUpdate() {
  io?.to('experts').emit('expert_queue:update', { count: getExpertQueueCount() });
}
