import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/me/preferences', authenticate, authController.updatePreferences);
router.post('/logout', authenticate, authController.logout);
router.get('/users', authenticate, authorize('super_admin', 'admin'), authController.listUsers);

export default router;
