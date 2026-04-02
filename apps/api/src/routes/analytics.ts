import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { AppError } from '../utils/AppError';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

// ─── PLANNER OVERVIEW STATS ──────────────────────────
analyticsRouter.get('/planner/overview', requireRole('PLANNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const planner = await prisma.planner.findFirst({ where: { userId } });
    if (!planner) throw new AppError('Planner not found', 404);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalEvents, liveEvents, totalAttendees, totalRevenue,
      recentAttendees, prevAttendees,
    ] = await Promise.all([
      prisma.event.count({ where: { plannerId: planner.id } }),
      prisma.event.count({ where: { plannerId: planner.id, status: 'LIVE' } }),
      prisma.attendee.count({
        where: { event: { plannerId: planner.id } }
      }),
      prisma.attendee.aggregate({
        where: { event: { plannerId: planner.id } },
        _sum: { amountPaid: true }
      }),
      prisma.attendee.count({
        where: {
          event: { plannerId: planner.id },
          registeredAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.attendee.count({
        where: {
          event: { plannerId: planner.id },
          registeredAt: { gte: prevPeriodStart, lt: thirtyDaysAgo }
        }
      }),
    ]);

    const registrationGrowth = prevAttendees > 0
      ? Math.round(((recentAttendees - prevAttendees) / prevAttendees) * 100)
      : 100;

    // Registrations by day (last 30 days)
    const registrationsByDay = await prisma.$queryRaw<any[]>`
      SELECT DATE(registered_at) as date, COUNT(*) as count
      FROM attendees a
      JOIN events e ON a.event_id = e.id
      WHERE e.planner_id = ${planner.id}::uuid
        AND a.registered_at >= ${thirtyDaysAgo}
      GROUP BY DATE(registered_at)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      stats: {
        totalEvents,
        liveEvents,
        totalAttendees,
        totalRevenue: Number(totalRevenue._sum.amountPaid || 0),
        recentAttendees,
        registrationGrowth,
      },
      registrationsByDay,
    });
  } catch (err) {
    next(err);
  }
});

// ─── EVENT-LEVEL ANALYTICS ───────────────────────────
analyticsRouter.get('/events/:eventId', requireRole('PLANNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).userId;
    const planner = await prisma.planner.findFirst({ where: { userId } });

    const event = await prisma.event.findFirst({
      where: { id: eventId, plannerId: planner!.id },
      include: {
        ticketTypes: true,
        _count: { select: { attendees: true, checkIns: true } }
      }
    });
    if (!event) throw new AppError('Event not found', 404);

    const revenue = event.ticketTypes.reduce(
      (sum, t) => sum + Number(t.price) * t.soldCount, 0
    );

    const attendeesByTicket = await prisma.attendee.groupBy({
      by: ['ticketTypeId'],
      where: { eventId },
      _count: true,
    });

    const checkInRate = event._count.attendees > 0
      ? Math.round((event._count.checkIns / event._count.attendees) * 100)
      : 0;

    const fillRate = event.maxCapacity
      ? Math.round((event._count.attendees / event.maxCapacity) * 100)
      : null;

    res.json({
      success: true,
      analytics: {
        totalAttendees: event._count.attendees,
        checkedIn: event._count.checkIns,
        checkInRate,
        fillRate,
        revenue,
        attendeesByTicket,
        capacity: event.maxCapacity,
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── CHECK-IN STATS (LIVE) ───────────────────────────
analyticsRouter.get('/events/:eventId/checkin-live', requireRole('PLANNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const [totalRegistered, totalCheckedIn, recentCheckIns] = await Promise.all([
      prisma.attendee.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { eventId } }),
      prisma.checkIn.findMany({
        where: { eventId },
        include: {
          attendee: {
            select: { firstName: true, lastName: true, ticketType: { select: { name: true } } }
          }
        },
        orderBy: { checkedInAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      totalRegistered,
      totalCheckedIn,
      checkInRate: totalRegistered > 0
        ? Math.round((totalCheckedIn / totalRegistered) * 100)
        : 0,
      recentCheckIns,
    });
  } catch (err) {
    next(err);
  }
});

// ─── VENDOR REVENUE ANALYTICS ────────────────────────
analyticsRouter.get('/vendor/revenue', requireRole('VENDOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) throw new AppError('Vendor not found', 404);

    const [
      totalBookings, confirmedBookings,
      totalRevenue, pendingPayout,
    ] = await Promise.all([
      prisma.booking.count({ where: { vendorId: vendor.id } }),
      prisma.booking.count({ where: { vendorId: vendor.id, status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        where: { vendorId: vendor.id, status: 'COMPLETED' },
        _sum: { vendorAmount: true }
      }),
      prisma.booking.aggregate({
        where: { vendorId: vendor.id, status: 'CONFIRMED', payoutReleasedAt: null },
        _sum: { vendorAmount: true }
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        totalRevenue: Number(totalRevenue._sum.vendorAmount || 0),
        pendingPayout: Number(pendingPayout._sum.vendorAmount || 0),
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
      }
    });
  } catch (err) {
    next(err);
  }
});
