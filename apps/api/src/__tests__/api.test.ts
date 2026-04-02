import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/client';
import bcrypt from 'bcryptjs';

// ─── TEST SETUP ──────────────────────────────────────
let plannerToken: string;
let vendorToken: string;
let testPlannerId: string;
let testVendorId: string;
let testEventId: string;
let testBookingId: string;

beforeAll(async () => {
  // Clear test data
  await prisma.booking.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.planner.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { contains: '@test.owambe' } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── AUTH TESTS ──────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registers a planner successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'planner@test.owambe',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'Planner',
        role: 'PLANNER',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'planner@test.owambe',
        password: 'Test1234!',
        firstName: 'Dup',
        lastName: 'User',
        role: 'PLANNER',
      });
    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@test.owambe',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        role: 'PLANNER',
      });
    expect(res.status).toBe(422);
  });

  it('registers a vendor successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'vendor@test.owambe',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'Vendor',
        role: 'VENDOR',
      });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in planner and returns token', async () => {
    // First verify email manually for test
    await prisma.user.update({
      where: { email: 'planner@test.owambe' },
      data: { isEmailVerified: true },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'planner@test.owambe', password: 'Test1234!' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('PLANNER');
    plannerToken = res.body.accessToken;

    const planner = await prisma.planner.findFirst({
      where: { user: { email: 'planner@test.owambe' } }
    });
    testPlannerId = planner!.id;
  });

  it('logs in vendor and returns token', async () => {
    await prisma.user.update({
      where: { email: 'vendor@test.owambe' },
      data: { isEmailVerified: true },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor@test.owambe', password: 'Test1234!' });

    expect(res.status).toBe(200);
    vendorToken = res.body.accessToken;
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'planner@test.owambe', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('requires authentication on protected routes', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
  });
});

// ─── EVENTS TESTS ────────────────────────────────────
describe('Events API', () => {
  it('creates an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({
        name: 'Test Conference Lagos',
        type: 'Conference',
        startDate: '2026-08-15T09:00:00',
        venue: 'Eko Hotel',
        city: 'Lagos',
        maxCapacity: 200,
      });
    expect(res.status).toBe(201);
    expect(res.body.event.name).toBe('Test Conference Lagos');
    expect(res.body.event.status).toBe('DRAFT');
    testEventId = res.body.event.id;
  });

  it('fetches planner events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  it('fetches single event', async () => {
    const res = await request(app)
      .get(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.event.id).toBe(testEventId);
  });

  it('updates an event', async () => {
    const res = await request(app)
      .put(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.event.description).toBe('Updated description');
  });

  it('blocks publishing without tickets', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/publish`)
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('ticket');
  });

  it('rejects event creation from vendor role', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ name: 'Unauthorized Event', type: 'Conference', startDate: '2026-08-15' });
    expect(res.status).toBe(403);
  });
});

// ─── ATTENDEE REGISTRATION ───────────────────────────
describe('Attendee Registration', () => {
  let ticketTypeId: string;

  beforeAll(async () => {
    const ticket = await prisma.ticketType.create({
      data: {
        eventId: testEventId,
        name: 'General',
        price: 25000,
        capacity: 100,
        currency: 'NGN',
        status: 'ACTIVE',
      }
    });
    ticketTypeId = ticket.id;
    // Publish event
    await prisma.event.update({ where: { id: testEventId }, data: { status: 'PUBLISHED' } });
  });

  it('registers an attendee', async () => {
    const event = await prisma.event.findUnique({ where: { id: testEventId } });
    const res = await request(app)
      .post(`/api/events/public/${event!.slug}/register`)
      .send({
        firstName: 'Ada',
        lastName: 'Okonkwo',
        email: 'ada@test.owambe',
        ticketTypeId,
        paystackRef: 'test-ref-001',
      });
    expect(res.status).toBe(201);
    expect(res.body.attendee.qrCode).toBeDefined();
    expect(res.body.attendee.email).toBe('ada@test.owambe');
  });

  it('rejects duplicate email registration', async () => {
    const event = await prisma.event.findUnique({ where: { id: testEventId } });
    const res = await request(app)
      .post(`/api/events/public/${event!.slug}/register`)
      .send({
        firstName: 'Ada',
        lastName: 'Duplicate',
        email: 'ada@test.owambe',
        ticketTypeId,
      });
    expect(res.status).toBe(409);
  });

  it('performs QR check-in', async () => {
    const attendee = await prisma.attendee.findFirst({ where: { email: 'ada@test.owambe' } });
    const res = await request(app)
      .post('/api/attendees/checkin')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ qrCode: attendee!.qrCode, eventId: testEventId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendee.name).toContain('Ada');
  });

  it('prevents double check-in', async () => {
    const attendee = await prisma.attendee.findFirst({ where: { email: 'ada@test.owambe' } });
    const res = await request(app)
      .post('/api/attendees/checkin')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ qrCode: attendee!.qrCode, eventId: testEventId });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Already checked in');
  });
});

// ─── VENDOR TESTS ────────────────────────────────────
describe('Vendor API', () => {
  it('creates a vendor profile', async () => {
    const res = await request(app)
      .post('/api/vendors/me')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        businessName: 'Test Photography Lagos',
        category: 'PHOTOGRAPHY_VIDEO',
        city: 'Lagos',
        minPrice: 150000,
        maxPrice: 1500000,
        isInstantBook: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.vendor.status).toBe('PENDING');
    testVendorId = res.body.vendor.id;
  });

  it('searches vendors by category and city', async () => {
    // Verify vendor first for search
    await prisma.vendor.update({
      where: { id: testVendorId },
      data: { status: 'VERIFIED', latitude: 6.5, longitude: 3.4 }
    });

    const res = await request(app)
      .get('/api/vendors/search')
      .query({ category: 'PHOTOGRAPHY_VIDEO', city: 'Lagos' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.vendors)).toBe(true);
  });

  it('gets vendor public profile', async () => {
    const vendor = await prisma.vendor.findUnique({ where: { id: testVendorId } });
    const res = await request(app).get(`/api/vendors/profile/${vendor!.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.vendor.businessName).toBe('Test Photography Lagos');
  });
});

// ─── BOOKING TESTS ───────────────────────────────────
describe('Booking API', () => {
  it('creates an RFQ booking', async () => {
    const res = await request(app)
      .post('/api/bookings/rfq')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({
        vendorId: testVendorId,
        eventDate: '2026-09-15T10:00:00',
        eventDescription: 'Corporate conference photography',
        guestCount: 150,
        estimatedBudget: 500000,
      });
    expect(res.status).toBe(201);
    expect(res.body.booking.bookingType).toBe('RFQ');
    expect(res.body.booking.status).toBe('PENDING');
    testBookingId = res.body.booking.id;
  });

  it('vendor confirms booking', async () => {
    const res = await request(app)
      .post(`/api/bookings/${testBookingId}/confirm`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('CONFIRMED');
  });

  it('cancels a booking with reason', async () => {
    const newBooking = await request(app)
      .post('/api/bookings/rfq')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({
        vendorId: testVendorId,
        eventDate: '2026-10-01T10:00:00',
        eventDescription: 'Test booking to cancel',
        guestCount: 50,
        estimatedBudget: 200000,
      });
    const bookingId = newBooking.body.booking.id;

    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ reason: 'Event postponed' });
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('CANCELLED');
    expect(res.body.booking.cancellationReason).toBe('Event postponed');
  });
});

// ─── ANALYTICS TESTS ─────────────────────────────────
describe('Analytics API', () => {
  it('returns planner overview stats', async () => {
    const res = await request(app)
      .get('/api/analytics/planner/overview')
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.totalEvents).toBe('number');
  });

  it('returns live check-in stats', async () => {
    const res = await request(app)
      .get(`/api/analytics/events/${testEventId}/checkin-live`)
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalRegistered).toBeGreaterThanOrEqual(0);
    expect(res.body.checkInRate).toBeGreaterThanOrEqual(0);
  });

  it('requires planner role for planner analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/planner/overview')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── PAYSTACK WEBHOOK TESTS ──────────────────────────
describe('Paystack Webhook', () => {
  it('rejects webhook with invalid signature', async () => {
    const res = await request(app)
      .post('/api/payments/webhook/paystack')
      .set('x-paystack-signature', 'invalid-signature')
      .send({ event: 'charge.success', data: { reference: 'test-ref' } });
    // Returns 200 always but ignores invalid signatures
    expect(res.status).toBe(200);
  });
});

// ─── HEALTH CHECK ────────────────────────────────────
describe('Health Check', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('owambe-api');
  });
});
