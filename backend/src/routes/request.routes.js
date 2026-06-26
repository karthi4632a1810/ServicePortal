import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requestController.list);
router.get('/assigned-to-me', authenticate, requestController.getAssignedToMe);
router.get('/employee/:employeeId', authenticate, requestController.getByEmployee);
router.get('/:id', optionalAuth, requestController.getById);
router.post('/', requestController.create);
router.post('/:id/comments', authenticate, requestController.addComment);
router.post('/:id/assign', authenticate, requestController.assign);
router.post('/:id/accept-processing', authenticate, requestController.acceptProcessing);
router.post('/:id/submit-for-review', authenticate, requestController.submitForReview);
router.post('/:id/confirm-completion', authenticate, requestController.confirmCompletion);
router.post('/:id/send-back-rework', authenticate, requestController.sendBackForRework);
router.patch('/:id/queue', authenticate, requestController.updateQueue);

export default router;
