import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requestController.list);
router.get('/employee/:employeeId', authenticate, requestController.getByEmployee);
router.get('/:id', optionalAuth, requestController.getById);
router.post('/', requestController.create);
router.post('/:id/comments', authenticate, requestController.addComment);
router.patch('/:id/queue', authenticate, requestController.updateQueue);

export default router;
