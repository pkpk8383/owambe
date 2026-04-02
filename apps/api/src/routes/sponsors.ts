import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

export const sponsorsRouter = Router();
sponsorsRouter.use(authenticate, requireRole('PLANNER'));

sponsorsRouter.get('/event/:eventId', async (req, res, next) => {
  try {
    const sponsors = await prisma.eventSponsor.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { tier: 'asc' },
    });
    res.json({ success: true, sponsors });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/event/:eventId', async (req, res, next) => {
  try {
    const sponsor = await prisma.eventSponsor.create({
      data: {
        eventId: req.params.eventId,
        name: req.body.name,
        logoUrl: req.body.logoUrl,
        tier: req.body.tier || 'BRONZE',
        amount: req.body.amount || 0,
        perks: req.body.perks,
        contactEmail: req.body.contactEmail,
      },
    });
    res.status(201).json({ success: true, sponsor });
  } catch (err) { next(err); }
});

sponsorsRouter.put('/:id', async (req, res, next) => {
  try {
    const sponsor = await prisma.eventSponsor.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, sponsor });
  } catch (err) { next(err); }
});

sponsorsRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.eventSponsor.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});
