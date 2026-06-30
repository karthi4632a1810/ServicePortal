import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('super_admin', 'admin', 'md', 'hod', 'processor', 'it_team', 'hr_team', 'finance_team'));

router.get('/summary', approvalController.summary);
router.get('/', approvalController.list);
router.post('/:requestId/approve', approvalController.approve);
router.post('/:requestId/reject', approvalController.reject);
router.post('/:requestId/forward', approvalController.forward);
router.post('/:requestId/request-info', approvalController.requestInfo);

export default router;
