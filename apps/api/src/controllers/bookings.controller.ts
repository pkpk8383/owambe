import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { AppError } from '../utils/AppError';
import { generateReference } from '../utils/slug';
import {
  initializeTransaction,
  computeSplit,
  verifyTransaction,
} from '../services/paystack.service';
import { sendEmail } from '../services/email.service';
import { logger } from '../utils/logger';

// ─── CREATE BOOKING (Instant) ────────────────────────
export async function createInstantBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const {
      vendorId, packageId, eventDate, eventDescription,
      guestCount, totalAmount, bookerEmail, bookerName
    } = req.body;

    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, status: 'VERIFIED', isInstantBook: true }
    });
    if (!vendor) throw new AppError('Vendor not available for instant booking', 404);

    // Check vendor availability
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        vendorId,
        eventDate: new Date(eventDate),
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    });
    if (conflictingBooking) throw new AppError('Vendor is not available on this date', 409);

    const reference = generateReference('OWB');
    const splits = computeSplit(Number(totalAmount), Number(vendor.commissionRate));

    // Determine if user is planner or consumer
    const planner = await prisma.planner.findFirst({ where: { userId } });
    const consumer = await prisma.consumer.findFirst({ where: { userId } });

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        reference,
        vendorId,
        plannerId: planner?.id,
        consumerId: consumer?.id,
        packageId,
        bookingType: 'INSTANT',
        status: 'PENDING',
        eventDate: new Date(eventDate),
        eventDescription,
        guestCount,
        totalAmount: splits.totalAmount,
        depositAmount: splits.depositAmount,
        commissionAmount: splits.commission,
        vendorAmount: splits.vendorAmount,
        currency: 'NGN',
        paymentStatus: 'PENDING',
      }
    });

    // Initialize Paystack payment for deposit
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const paymentInit = await initializeTransaction({
      email: bookerEmail || user!.email,
      amount: splits.depositAmount,
      reference: `${reference}-DEP`,
      metadata: {
        bookingId: booking.id,
        bookingReference: reference,
        type: 'DEPOSIT',
        vendorName: vendor.businessName,
      },
      ...(vendor.paystackSubAccountCode && {
        subaccount: vendor.paystackSubAccountCode,
        transactionCharge: splits.commission,
        bearer: 'account',
      }),
    });

    logger.info(`Instant booking created: ${reference}`);
    res.status(201).json({
      success: true,
      booking,
      payment: {
        authorizationUrl: paymentInit.authorization_url,
        reference: paymentInit.reference,
        depositAmount: splits.depositAmount,
        balanceAmount: splits.balanceAmount,
      }
    });
  } catch (err) {
    next(err);
  }
}

// ─── CREATE RFQ BOOKING ──────────────────────────────
export async function createRfqBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const {
      vendorId, eventDate, eventDescription, guestCount,
      estimatedBudget, requirements
    } = req.body;

    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, status: 'VERIFIED' }
    });
    if (!vendor) throw new AppError('Vendor not found', 404);

    const reference = generateReference('RFQ');
    const planner = await prisma.planner.findFirst({ where: { userId } });
    const consumer = await prisma.consumer.findFirst({ where: { userId } });

    const booking = await prisma.booking.create({
      data: {
        reference,
        vendorId,
        plannerId: planner?.id,
        consumerId: consumer?.id,
        bookingType: 'RFQ',
        status: 'PENDING',
        eventDate: new Date(eventDate),
        eventDescription,
        guestCount,
        totalAmount: estimatedBudget || 0,
        depositAmount: 0,
        commissionAmount: 0,
        vendorAmount: 0,
        currency: 'NGN',
        paymentStatus: 'PENDING',
        notes: requirements,
      }
    });

    // Notify vendor
    const vendorUser = await prisma.user.findUnique({ where: { id: vendor.userId } });
    if (vendorUser) {
      await sendEmail({
        to: vendorUser.email,
        subject: `New RFQ Request — ${eventDate}`,
        template: 'rfq-received',
        data: {
          vendorName: vendor.businessName,
          eventDate,
          guestCount,
          estimatedBudget: `₦${Number(estimatedBudget).toLocaleString()}`,
          eventDescription,
          respondUrl: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/bookings/${booking.id}`,
        }
      });
    }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    next(err);
  }
}

// ─── GET MY BOOKINGS ─────────────────────────────────
export async function getMyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    if (status) where.status = status;

    if (userRole === 'PLANNER') {
      const planner = await prisma.planner.findFirst({ where: { userId } });
      where.plannerId = planner?.id;
    } else if (userRole === 'VENDOR') {
      const vendor = await prisma.vendor.findFirst({ where: { userId } });
      where.vendorId = vendor?.id;
    } else if (userRole === 'CONSUMER') {
      const consumer = await prisma.consumer.findFirst({ where: { userId } });
      where.consumerId = consumer?.id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          vendor: { select: { businessName: true, category: true, city: true, rating: true } },
          package: { select: { name: true, price: true } },
          quote: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.booking.count({ where })
    ]);

    res.json({ success: true, bookings, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── CONFIRM BOOKING (Vendor) ────────────────────────
export async function confirmBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });

    const booking = await prisma.booking.findFirst({
      where: { id, vendorId: vendor?.id }
    });
    if (!booking) throw new AppError('Booking not found', 404);

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    });

    // Notify booker
    const booker = booking.plannerId
      ? await prisma.planner.findUnique({ where: { id: booking.plannerId }, include: { user: true } })
      : await prisma.consumer.findUnique({ where: { id: booking.consumerId! }, include: { user: true } });

    if (booker?.user) {
      await sendEmail({
        to: booker.user.email,
        subject: `Booking Confirmed — ${vendor!.businessName}`,
        template: 'booking-confirmed',
        data: {
          firstName: booker.user.firstName,
          vendorName: vendor!.businessName,
          eventDate: booking.eventDate,
          reference: booking.reference,
        }
      });
    }

    res.json({ success: true, booking: updated });
  } catch (err) {
    next(err);
  }
}

// ─── CANCEL BOOKING ──────────────────────────────────
export async function cancelBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).userId;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Booking not found', 404);

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
      }
    });

    logger.info(`Booking cancelled: ${id} — ${reason}`);
    res.json({ success: true, booking: updated });
  } catch (err) {
    next(err);
  }
}

// ─── SUBMIT QUOTE (Vendor for RFQ) ───────────────────
export async function submitQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { lineItems, totalAmount, validUntil, notes } = req.body;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });

    const booking = await prisma.booking.findFirst({
      where: { id, vendorId: vendor?.id, bookingType: 'RFQ' }
    });
    if (!booking) throw new AppError('Booking not found', 404);

    const quote = await prisma.quote.create({
      data: {
        bookingId: id,
        vendorId: vendor!.id,
        lineItems,
        totalAmount,
        validUntil: new Date(validUntil),
        notes,
        status: 'SENT',
      }
    });

    await prisma.booking.update({
      where: { id },
      data: { totalAmount }
    });

    res.status(201).json({ success: true, quote });
  } catch (err) {
    next(err);
  }
}
