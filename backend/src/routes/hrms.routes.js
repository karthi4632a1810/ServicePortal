import { Router } from 'express';
import { hrmsController } from '../controllers/hrms.controller.js';

const router = Router();

router.get('/health', hrmsController.health);
router.get('/columns', hrmsController.getColumns);
router.get('/departments', hrmsController.getDepartments);
router.get('/designations', hrmsController.getDesignations);
router.get('/employee/:employeeId', hrmsController.getEmployee);

export default router;
