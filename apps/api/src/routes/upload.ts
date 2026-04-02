import { Router } from 'express';
import { prisma } from '../database/client';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../services/upload.service';
import { logger } from '../utils/logger';

export const uploadRouter = Router();
uploadRouter.use(authenticate);

// Single image upload (cover photos, avatars)
uploadRouter.post('/image', upload.single('image'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    res.json({ success: true, url: req.file.location, key: req.file.key });
  } catch (err) { next(err); }
});

// Portfolio upload (vendors — up to 10 images)
uploadRouter.post('/portfolio', upload.array('images', 10), async (req: any, res, next) => {
  try {
    const userId = (req as any).userId;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    const files = req.files as any[];
    const hasMain = await prisma.portfolioItem.findFirst({
      where: { vendorId: vendor.id, isMain: true },
    });

    const items = await Promise.all(
      files.map((f, i) =>
        prisma.portfolioItem.create({
          data: {
            vendorId: vendor.id,
            url: f.location,
            isMain: !hasMain && i === 0,
            sortOrder: i,
          },
        })
      )
    );

    logger.info(`Portfolio updated: ${vendor.id} — ${files.length} images uploaded`);
    res.json({ success: true, items });
  } catch (err) { next(err); }
});

// Delete portfolio item
uploadRouter.delete('/portfolio/:itemId', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    await prisma.portfolioItem.deleteMany({
      where: { id: req.params.itemId, vendorId: vendor.id },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Set main portfolio photo
uploadRouter.patch('/portfolio/:itemId/main', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    await prisma.$transaction([
      prisma.portfolioItem.updateMany({
        where: { vendorId: vendor.id },
        data: { isMain: false },
      }),
      prisma.portfolioItem.update({
        where: { id: req.params.itemId },
        data: { isMain: true },
      }),
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
});
