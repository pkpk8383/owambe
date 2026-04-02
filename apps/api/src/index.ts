import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { validateEnv } from './utils/env';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestId, ipLogger, auditLog, requestTimeout } from './middleware/security';

import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { attendeesRouter } from './routes/attendees';
import { vendorsRouter } from './routes/vendors';
import { bookingsRouter } from './routes/bookings';
import { paymentsRouter } from './routes/payments';
import { speakersRouter } from './routes/speakers';
import { sponsorsRouter } from './routes/sponsors';
import { emailsRouter } from './routes/emails';
import { analyticsRouter } from './routes/analytics';
import { uploadRouter } from './routes/upload';
import { aiRouter } from './routes/ai';
import { adminRouter } from './routes/admin';
import { notificationsRouter } from './routes/notifications';
import { messagesRouter } from './routes/messages';

import { initSocket } from './socket';
import { logger } from './utils/logger';
import { prisma } from './database/client';

validateEnv();

export const app = express();
export const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', credentials: true },
  transports: ['websocket', 'polling'],
});
initSocket(io);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(compression());
app.use(requestId);
app.use(ipLogger);
app.use(requestTimeout(30000));
app.use('/api/payments/webhook/paystack', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(auditLog);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'owambe-api', version: '1.0.0' });
});

app.use('/api/auth', rateLimiter({ windowMs: 60000, max: 15 }));
app.use('/api/ai', rateLimiter({ windowMs: 60000, max: 20 }));
app.use('/api/upload', rateLimiter({ windowMs: 60000, max: 30 }));
app.use('/api', rateLimiter({ windowMs: 60000, max: 300 }));

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/attendees', attendeesRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/speakers', speakersRouter);
app.use('/api/sponsors', sponsorsRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api', messagesRouter);

app.use((_req, res) => { res.status(404).json({ success: false, error: 'Route not found' }); });
app.use(errorHandler);

const PORT = Number(process.env.API_PORT) || 4000;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Owambe API running on port ${PORT}`);
    });
    process.on('SIGTERM', async () => { httpServer.close(); await prisma.$disconnect(); process.exit(0); });
    process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') { bootstrap(); }

export { io };
