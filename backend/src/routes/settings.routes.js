import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/organization', authenticate, settingsController.getOrganization);
router.put(
  '/organization',
  authenticate,
  authorize('super_admin', 'admin'),
  settingsController.updateOrganization,
);

export default router;
