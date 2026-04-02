import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
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

// ─── VENDOR (authenticated) ──────────────────────────
vendorsRouter.use('/me', authenticate, requireRole('VENDOR'));
vendorsRouter.get('/me', getMyVendorProfile);
vendorsRouter.post('/me', [
  body('businessName').trim().notEmpty(),
  body('category').notEmpty(),
  body('city').notEmpty(),
], validate, createVendorProfile);
vendorsRouter.put('/me', updateVendorProfile);
vendorsRouter.post('/me/bank-account', [
  body('bankCode').notEmpty(),
  body('accountNumber').isLength({ min: 10, max: 10 }),
], validate, authenticate, setupBankAccount);
vendorsRouter.put('/me/availability', authenticate, setAvailability);
vendorsRouter.post('/me/packages', authenticate, addPackage);
vendorsRouter.post('/generate-bio', authenticate, generateBio);
