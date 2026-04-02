import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { AppError } from '../utils/AppError';

export const messagesRouter = Router();
messagesRouter.use(authenticate);

// Get messages for a booking
messagesRouter.get('/bookings/:bookingId/messages', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { bookingId } = req.params;

    // Verify user has access to this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { planner: { userId } },
          { consumer: { userId } },
          { vendor: { userId } },
        ],
      },
    });
    if (!booking) throw new AppError('Booking not found or access denied', 404);

    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: { bookingId, receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, messages });
  } catch (err) { next(err); }
});

// Send a message
messagesRouter.post('/bookings/:bookingId/messages', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { bookingId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) throw new AppError('Message body required', 400);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { planner: { userId } },
          { consumer: { userId } },
          { vendor: { userId } },
        ],
      },
      include: {
        vendor: { select: { userId: true } },
        planner: { select: { userId: true } },
        consumer: { select: { userId: true } },
      },
    });
    if (!booking) throw new AppError('Booking not found or access denied', 404);

    // Determine the receiver (the other party)
    let receiverId: string;
    if (booking.vendor.userId === userId) {
      receiverId = booking.planner?.userId || booking.consumer?.userId || userId;
    } else {
      receiverId = booking.vendor.userId;
    }

    const message = await prisma.message.create({
      data: { bookingId, senderId: userId, receiverId, body: body.trim() },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
});
