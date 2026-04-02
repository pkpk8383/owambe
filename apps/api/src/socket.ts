import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';

export function initSocket(io: Server) {
  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.info(`Socket connected: ${userId}`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Join event room for real-time check-in
    socket.on('join:event', (eventId: string) => {
      socket.join(`event:${eventId}`);
      logger.info(`${userId} joined event room: ${eventId}`);
    });

    socket.on('leave:event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    // Check-in broadcast (triggered by check-in controller)
    socket.on('checkin:scan', (data: { eventId: string; attendee: any }) => {
      io.to(`event:${data.eventId}`).emit('checkin:update', {
        attendee: data.attendee,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });
}

// ─── EMIT HELPERS (called from controllers) ──────────
export function emitNotification(io: Server, userId: string, notification: any) {
  io.to(`user:${userId}`).emit('notification', notification);
}

export function emitCheckinUpdate(io: Server, eventId: string, data: any) {
  io.to(`event:${eventId}`).emit('checkin:update', data);
}
