import { Router } from 'express';
import {
  workflowController,
  dashboardController,
  searchController,
  auditController,
  departmentController,
  notificationController,
  uploadController,
} from '../controllers/misc.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createUploadMiddleware } from '../middleware/upload.js';
import { prepareUploadContext } from '../middleware/prepareUpload.js';
import { filesController } from '../controllers/files.controller.js';

const filesRoutes = Router();
filesRoutes.use(authenticate);
filesRoutes.get('/serve', filesController.serve);

const workflowRoutes = Router();
workflowRoutes.get('/', workflowController.list);
workflowRoutes.get('/:id', workflowController.getById);

const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);
dashboardRoutes.get('/stats', dashboardController.stats);
dashboardRoutes.get('/charts/weekly', dashboardController.weeklyChart);
dashboardRoutes.get('/charts/status', dashboardController.statusChart);
dashboardRoutes.get('/charts/department', dashboardController.departmentChart);
dashboardRoutes.get('/recent', dashboardController.recentRequests);

const searchRoutes = Router();
searchRoutes.use(authenticate);
searchRoutes.get('/', searchController.search);

const auditRoutes = Router();
auditRoutes.use(authenticate, authorize('super_admin', 'admin', 'md'));
auditRoutes.get('/', auditController.list);

const departmentRoutes = Router();
departmentRoutes.get('/', departmentController.list);
departmentRoutes.get('/:code/queue', authenticate, departmentController.queue);

const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get('/', notificationController.list);

const uploadRoutes = Router();
const uploadHandler = createUploadMiddleware();
uploadRoutes.post('/', prepareUploadContext, uploadHandler.single('file'), uploadController.upload);

export {
  workflowRoutes,
  dashboardRoutes,
  searchRoutes,
  auditRoutes,
  departmentRoutes,
  notificationRoutes,
  uploadRoutes,
  filesRoutes,
};
