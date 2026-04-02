import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({ success: true, notifications, total, unreadCount });
  } catch (err) { next(err); }
});

notificationsRouter.put('/:id/read', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notificationsRouter.put('/read-all', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notificationsRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Helper: create a notification (called from other controllers)
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  notificationData?: Record<string, any>;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      body: data.body,
      data: data.notificationData,
    },
  });
}
