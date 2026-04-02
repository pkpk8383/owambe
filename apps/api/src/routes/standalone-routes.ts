import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../database/client';
import { upload } from '../services/upload.service';
import { generateEventCopy, generateEmailCopy, extractEventDetails, generateEventPlans } from '../services/ai.service';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';

// ─── UPLOAD ──────────────────────────────────────────
export const uploadRouter = Router();
uploadRouter.use(authenticate);

uploadRouter.post('/image', upload.single('image'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    res.json({ success: true, url: req.file.location, key: req.file.key });
  } catch (err) { next(err); }
});

uploadRouter.post('/portfolio', upload.array('images', 10), async (req: any, res, next) => {
  try {
    const userId = (req as any).userId;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    const files = req.files as any[];
    const items = await Promise.all(files.map((f, i) =>
      prisma.portfolioItem.create({
        data: { vendorId: vendor.id, url: f.location, isMain: i === 0, sortOrder: i }
      })
    ));
    res.json({ success: true, items });
  } catch (err) { next(err); }
});

// ─── AI ──────────────────────────────────────────────
export const aiRouter = Router();
aiRouter.use(authenticate);

aiRouter.post('/event-copy', async (req, res, next) => {
  try {
    const copy = await generateEventCopy(req.body.prompt);
    res.json({ success: true, ...copy });
  } catch (err) { next(err); }
});

aiRouter.post('/plan/intake', async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const result = await extractEventDetails(message, conversationHistory);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

aiRouter.post('/plan/generate', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const consumer = await prisma.consumer.findFirst({ where: { userId } });
    if (!consumer) return res.status(403).json({ success: false, error: 'Consumer account required' });

    const { eventType, location, date, guestCount, totalBudget, preferences } = req.body;
    const sessionId = req.body.sessionId || uuid();

    const plans = await generateEventPlans({ eventType, location, date, guestCount, totalBudget, preferences });

    await prisma.aiEventPlan.upsert({
      where: { sessionId },
      update: { plans: plans as any, status: 'GENERATED' },
      create: {
        consumerId: consumer.id,
        sessionId,
        eventType, location, city: location,
        date: new Date(date), guestCount, totalBudget,
        preferences, plans: plans as any, status: 'GENERATED'
      }
    });

    res.json({ success: true, ...plans });
  } catch (err) { next(err); }
});

// ─── NOTIFICATIONS ────────────────────────────────────
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (err) { next(err); }
});

notificationsRouter.put('/read-all', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notificationsRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── ADMIN ───────────────────────────────────────────
export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/vendors/pending', async (req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, vendors });
  } catch (err) { next(err); }
});

adminRouter.put('/vendors/:id/verify', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status: 'VERIFIED', verifiedAt: new Date() }
    });
    logger.info(`Vendor verified: ${vendor.id}`);
    res.json({ success: true, vendor });
  } catch (err) { next(err); }
});

adminRouter.put('/vendors/:id/reject', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: req.body.reason }
    });
    res.json({ success: true, vendor });
  } catch (err) { next(err); }
});

adminRouter.get('/platform/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalVendors, totalEvents, totalBookings, gmv] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count({ where: { status: 'VERIFIED' } }),
      prisma.event.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true, commissionAmount: true }
      })
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers, totalVendors, totalEvents, totalBookings,
        totalGMV: Number(gmv._sum.totalAmount || 0),
        totalCommission: Number(gmv._sum.commissionAmount || 0),
      }
    });
  } catch (err) { next(err); }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const where: any = {};
    if (role) where.role = role;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true, lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.user.count({ where })
    ]);
    res.json({ success: true, users, total });
  } catch (err) { next(err); }
});

adminRouter.put('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ success: true, message: `User ${user.email} suspended` });
  } catch (err) { next(err); }
});
