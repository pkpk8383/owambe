import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { generateQrCode } from '../utils/qrcode';
import { generateEventCopy, generateEmailCopy, extractEventDetails, generateEventPlans } from '../services/ai.service';
import { sendEmail } from '../services/email.service';
import { upload } from '../services/upload.service';
import { logger } from '../utils/logger';

// ─── SPONSORS ────────────────────────────────────────
export const sponsorsRouter = Router();
sponsorsRouter.use(authenticate, requireRole('PLANNER'));

sponsorsRouter.get('/event/:eventId', async (req, res, next) => {
  try {
    const sponsors = await prisma.eventSponsor.findMany({ where: { eventId: req.params.eventId } });
    res.json({ success: true, sponsors });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/event/:eventId', async (req, res, next) => {
  try {
    const sponsor = await prisma.eventSponsor.create({
      data: { eventId: req.params.eventId, ...req.body }
    });
    res.status(201).json({ success: true, sponsor });
  } catch (err) { next(err); }
});

sponsorsRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.eventSponsor.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── EMAIL CAMPAIGNS ──────────────────────────────────
export const emailsRouter = Router();
emailsRouter.use(authenticate, requireRole('PLANNER'));

emailsRouter.get('/event/:eventId', async (req, res, next) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, campaigns });
  } catch (err) { next(err); }
});

emailsRouter.post('/event/:eventId', async (req, res, next) => {
  try {
    const campaign = await prisma.emailCampaign.create({
      data: { eventId: req.params.eventId, ...req.body }
    });
    res.status(201).json({ success: true, campaign });
  } catch (err) { next(err); }
});

emailsRouter.post('/event/:eventId/send/:campaignId', async (req, res, next) => {
  try {
    const { campaignId, eventId } = req.params;
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, eventId }
    });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const attendees = await prisma.attendee.findMany({ where: { eventId } });

    // Queue emails (in production use a job queue like Bull)
    let sent = 0;
    for (const attendee of attendees) {
      await sendEmail({
        to: attendee.email,
        subject: campaign.subject,
        template: 'custom-campaign',
        data: { firstName: attendee.firstName, body: campaign.body }
      });
      sent++;
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', sentAt: new Date(), recipientCount: sent }
    });

    res.json({ success: true, sent });
  } catch (err) { next(err); }
});

emailsRouter.post('/ai-generate', async (req, res, next) => {
  try {
    const { eventName, purpose } = req.body;
    const copy = await generateEmailCopy(eventName, purpose);
    res.json({ success: true, ...copy });
  } catch (err) { next(err); }
});

// ─── ATTENDEES ────────────────────────────────────────
export const attendeesRouter = Router();
attendeesRouter.use(authenticate);

attendeesRouter.get('/event/:eventId', requireRole('PLANNER'), async (req, res, next) => {
  try {
    const { search, ticketTypeId, status, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { eventId: req.params.eventId };
    if (ticketTypeId) where.ticketTypeId = ticketTypeId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    const [attendees, total] = await Promise.all([
      prisma.attendee.findMany({
        where, include: { ticketType: { select: { name: true } } },
        orderBy: { registeredAt: 'desc' }, skip, take: Number(limit),
      }),
      prisma.attendee.count({ where })
    ]);
    res.json({ success: true, attendees, total });
  } catch (err) { next(err); }
});

attendeesRouter.post('/checkin', requireRole('PLANNER'), async (req, res, next) => {
  try {
    const { qrCode, eventId } = req.body;
    const attendee = await prisma.attendee.findFirst({
      where: { qrCode, eventId },
      include: { ticketType: { select: { name: true } } }
    });
    if (!attendee) return res.status(404).json({ success: false, error: 'Attendee not found' });
    if (attendee.status === 'CHECKED_IN') {
      return res.status(409).json({
        success: false,
        error: 'Already checked in',
        attendee: { name: `${attendee.firstName} ${attendee.lastName}`, ticket: attendee.ticketType.name }
      });
    }

    await prisma.$transaction([
      prisma.attendee.update({ where: { id: attendee.id }, data: { status: 'CHECKED_IN' } }),
      prisma.checkIn.create({ data: { eventId, attendeeId: attendee.id } })
    ]);

    res.json({
      success: true,
      message: 'Checked in successfully',
      attendee: {
        name: `${attendee.firstName} ${attendee.lastName}`,
        email: attendee.email,
        ticket: attendee.ticketType.name,
      }
    });
  } catch (err) { next(err); }
});

attendeesRouter.get('/ticket/:qrCode', async (req, res, next) => {
  try {
    const attendee = await prisma.attendee.findFirst({
      where: { qrCode: req.params.qrCode },
      include: {
        event: { select: { name: true, startDate: true, venue: true, city: true } },
        ticketType: { select: { name: true } }
      }
    });
    if (!attendee) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, attendee });
  } catch (err) { next(err); }
});

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

// ─── AI ROUTES ───────────────────────────────────────
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

    const { eventType, location, date, guestCount, totalBudget, preferences, sessionId } = req.body;
    const plans = await generateEventPlans({ eventType, location, date, guestCount, totalBudget, preferences });

    // Save plan to DB
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
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
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
