import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  createInstantBooking, createRfqBooking, getMyBookings,
  confirmBooking, cancelBooking, submitQuote,
} from '../controllers/bookings.controller';

export const bookingsRouter = Router();

bookingsRouter.use(authenticate);

bookingsRouter.get('/', getMyBookings);

bookingsRouter.post('/instant', [
  body('vendorId').isUUID(),
  body('eventDate').isISO8601(),
  body('totalAmount').isNumeric(),
], validate, createInstantBooking);

bookingsRouter.post('/rfq', [
  body('vendorId').isUUID(),
  body('eventDate').isISO8601(),
  body('eventDescription').notEmpty(),
], validate, createRfqBooking);

bookingsRouter.post('/:id/confirm', confirmBooking);
bookingsRouter.post('/:id/cancel', cancelBooking);
bookingsRouter.post('/:id/quote', [
  body('lineItems').isArray(),
  body('totalAmount').isNumeric(),
  body('validUntil').isISO8601(),
], validate, submitQuote);
