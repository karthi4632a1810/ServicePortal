import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/employee-login', authController.employeeLogin);
router.get('/me', authenticate, authController.me);
router.patch('/me/preferences', authenticate, authController.updatePreferences);
router.post('/me/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);
router.get('/users', authenticate, authorize('super_admin'), authController.listUsers);
router.post('/users', authenticate, authorize('super_admin'), authController.createUser);
router.post('/users/import', authenticate, authorize('super_admin'), authController.importUsers);
router.post('/users/bulk/role', authenticate, authorize('super_admin'), authController.bulkUpdateRole);
router.post('/users/bulk/reset-password', authenticate, authorize('super_admin'), authController.bulkResetPassword);
router.patch('/users/:id', authenticate, authorize('super_admin'), authController.updateUser);
router.post('/users/:id/reset-password', authenticate, authorize('super_admin'), authController.resetUserPassword);

export default router;
