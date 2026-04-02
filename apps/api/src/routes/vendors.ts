import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../database/client';
import {
  searchVendors, getVendorProfile, createVendorProfile,
  updateVendorProfile, getMyVendorProfile, setupBankAccount,
  getAvailability, setAvailability, generateBio, addPackage,
} from '../controllers/vendors.controller';

export const vendorsRouter = Router();

// ─── PUBLIC ──────────────────────────────────────────
vendorsRouter.get('/search', searchVendors);
vendorsRouter.get('/profile/:slug', getVendorProfile);
vendorsRouter.get('/:vendorId/availability', getAvailability);

// ─── AUTHENTICATED VENDOR ROUTES ─────────────────────
vendorsRouter.get('/me', authenticate, requireRole('VENDOR'), getMyVendorProfile);

vendorsRouter.post('/me',
  authenticate, requireRole('VENDOR'),
  [body('businessName').trim().notEmpty(), body('category').notEmpty(), body('city').notEmpty()],
  validate, createVendorProfile
);

vendorsRouter.put('/me', authenticate, requireRole('VENDOR'), updateVendorProfile);

vendorsRouter.post('/me/bank-account',
  authenticate, requireRole('VENDOR'),
  [body('bankCode').notEmpty(), body('accountNumber').isLength({ min: 10, max: 10 })],
  validate, setupBankAccount
);

vendorsRouter.put('/me/availability', authenticate, requireRole('VENDOR'), setAvailability);
vendorsRouter.post('/me/packages', authenticate, requireRole('VENDOR'), addPackage);
vendorsRouter.post('/generate-bio', authenticate, generateBio);

// ─── REVIEW REPLY ────────────────────────────────────
vendorsRouter.put('/reviews/:reviewId/reply', authenticate, requireRole('VENDOR'), async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { response } = req.body;
    if (!response?.trim()) return res.status(400).json({ success: false, error: 'Response is required' });

    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    const review = await prisma.review.findFirst({
      where: { id: req.params.reviewId, vendorId: vendor.id },
    });
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    if (review.response) return res.status(409).json({ success: false, error: 'Already replied' });

    const updated = await prisma.review.update({
      where: { id: req.params.reviewId },
      data: { response: response.trim(), respondedAt: new Date() },
    });

    res.json({ success: true, review: updated });
  } catch (err) { next(err); }
});
