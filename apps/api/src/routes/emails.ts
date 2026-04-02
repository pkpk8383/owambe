import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { generateEmailCopy } from '../services/ai.service';
import { queueBulkCampaign } from '../services/queue.service';
import { logger } from '../utils/logger';

export const emailsRouter = Router();
emailsRouter.use(authenticate, requireRole('PLANNER'));

emailsRouter.get('/event/:eventId', async (req, res, next) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, campaigns });
  } catch (err) { next(err); }
});

emailsRouter.post('/event/:eventId', async (req, res, next) => {
  try {
    const campaign = await prisma.emailCampaign.create({
      data: {
        eventId: req.params.eventId,
        name: req.body.name,
        subject: req.body.subject,
        body: req.body.body,
        audience: req.body.audience || 'ALL',
        status: 'DRAFT',
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
      },
    });
    res.status(201).json({ success: true, campaign });
  } catch (err) { next(err); }
});

emailsRouter.post('/event/:eventId/send/:campaignId', async (req, res, next) => {
  try {
    const { campaignId, eventId } = req.params;
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, eventId },
    });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const attendees = await prisma.attendee.findMany({
      where: { eventId },
      select: { email: true, firstName: true },
    });

    queueBulkCampaign(attendees, { subject: campaign.subject, body: campaign.body });

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', sentAt: new Date(), recipientCount: attendees.length },
    });

    logger.info(`Campaign ${campaignId} queued for ${attendees.length} recipients`);
    res.json({ success: true, queued: attendees.length });
  } catch (err) { next(err); }
});

emailsRouter.post('/ai-generate', async (req, res, next) => {
  try {
    const { eventName, purpose } = req.body;
    const copy = await generateEmailCopy(eventName, purpose);
    res.json({ success: true, ...copy });
  } catch (err) { next(err); }
});
