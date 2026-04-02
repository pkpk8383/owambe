import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { attendeesRouter } from './routes/attendees';
import { vendorsRouter } from './routes/vendors';
import { bookingsRouter } from './routes/bookings';
import { paymentsRouter } from './routes/payments';
import { speakersRouter } from './routes/speakers';
import { analyticsRouter } from './routes/analytics';
import { uploadRouter } from './routes/upload';
import { aiRouter } from './routes/ai';
import { adminRouter } from './routes/admin';
import { notificationsRouter } from './routes/notifications';
import { sponsorsRouter, emailsRouter, attendeesRouter as atRouter } from './routes/all-routes';
import { initSocket } from './socket';
import { logger } from './utils/logger';
import { prisma } from './database/client';

export const app = express();
export const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true }
});
initSocket(io);

app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'owambe-api' });
});

app.use('/api/auth', rateLimiter({ windowMs: 60 * 1000, max: 20 }));
app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 300 }));

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/attendees', atRouter);
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

app.use(errorHandler);

// Only listen if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.API_PORT || 4000;

  async function bootstrap() {
    try {
      await prisma.$connect();
      logger.info('Database connected');
      httpServer.listen(PORT, () => {
        logger.info(`Owambe API running on port ${PORT}`);
      });
    } catch (err) {
      logger.error('Failed to start server', err);
      process.exit(1);
    }
  }

  bootstrap();
}

export { io };
