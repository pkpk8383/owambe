import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { generateQrCode } from '../utils/qrcode';

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
        where,
        include: { ticketType: { select: { name: true } } },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: Number(limit),
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
