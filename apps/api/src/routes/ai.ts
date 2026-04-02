import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import {
  generateEventCopy,
  generateEmailCopy,
  extractEventDetails,
  generateEventPlans,
  generateVendorBio,
} from '../services/ai.service';
import { AppError } from '../utils/AppError';

export const aiRouter = Router();
aiRouter.use(authenticate);

// Generate event name + description from a prompt
aiRouter.post('/event-copy', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) throw new AppError('prompt is required', 400);
    const copy = await generateEventCopy(prompt);
    res.json({ success: true, ...copy });
  } catch (err) { next(err); }
});

// Generate email copy from event name + purpose
aiRouter.post('/email-copy', async (req, res, next) => {
  try {
    const { eventName, purpose } = req.body;
    const copy = await generateEmailCopy(eventName || 'Your Event', purpose || 'general update');
    res.json({ success: true, ...copy });
  } catch (err) { next(err); }
});

// Conversational intake — extract event details from natural language
aiRouter.post('/plan/intake', async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) throw new AppError('message is required', 400);
    const result = await extractEventDetails(message, conversationHistory);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Generate 3-tier vendor plans
aiRouter.post('/plan/generate', async (req, res, next) => {
  try {
    const userId = (req as any).userId;

    // Allow both planners and consumers to generate plans
    const consumer = await prisma.consumer.findFirst({ where: { userId } });
    const planner = await prisma.planner.findFirst({ where: { userId } });
    if (!consumer && !planner) {
      throw new AppError('Account not found', 404);
    }

    const {
      eventType, location, date, guestCount,
      totalBudget, preferences, sessionId,
    } = req.body;

    const sid = sessionId || uuid();
    const plans = await generateEventPlans({
      eventType, location, date, guestCount, totalBudget, preferences,
    });

    // Persist plan for consumers
    if (consumer) {
      await prisma.aiEventPlan.upsert({
        where: { sessionId: sid },
        update: { plans: plans as any, status: 'GENERATED' },
        create: {
          consumerId: consumer.id,
          sessionId: sid,
          eventType,
          location,
          city: location,
          date: new Date(date),
          guestCount: Number(guestCount),
          totalBudget: Number(totalBudget),
          preferences: preferences || {},
          plans: plans as any,
          status: 'GENERATED',
        },
      });
    }

    res.json({ success: true, sessionId: sid, ...plans });
  } catch (err) { next(err); }
});

// Get saved AI plans for a consumer
aiRouter.get('/plans', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const consumer = await prisma.consumer.findFirst({ where: { userId } });
    if (!consumer) return res.json({ success: true, plans: [] });

    const plans = await prisma.aiEventPlan.findMany({
      where: { consumerId: consumer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ success: true, plans });
  } catch (err) { next(err); }
});

// Generate vendor bio from details
aiRouter.post('/vendor-bio', async (req, res, next) => {
  try {
    const { businessName, category, details } = req.body;
    const bio = await generateVendorBio(
      businessName || 'Our Business',
      category || 'vendor',
      details || 'Lagos-based event service provider'
    );
    res.json({ success: true, ...bio });
  } catch (err) { next(err); }
});
