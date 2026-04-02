// ─── speakers.ts ─────────────────────────────────────
import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { AppError } from '../utils/AppError';

export const speakersRouter = Router();
speakersRouter.use(authenticate, requireRole('PLANNER'));

speakersRouter.get('/event/:eventId', async (req, res, next) => {
  try {
    const speakers = await prisma.speaker.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, speakers });
  } catch (err) { next(err); }
});

speakersRouter.post('/event/:eventId', async (req, res, next) => {
  try {
    const speaker = await prisma.speaker.create({
      data: { eventId: req.params.eventId, ...req.body }
    });
    res.status(201).json({ success: true, speaker });
  } catch (err) { next(err); }
});

speakersRouter.put('/:id', async (req, res, next) => {
  try {
    const speaker = await prisma.speaker.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, speaker });
  } catch (err) { next(err); }
});

speakersRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.speaker.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

speakersRouter.patch('/:id/checklist', async (req, res, next) => {
  try {
    const speaker = await prisma.speaker.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, speaker });
  } catch (err) { next(err); }
});
