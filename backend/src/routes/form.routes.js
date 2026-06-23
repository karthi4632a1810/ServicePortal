import { Router } from 'express';
import { formController, formBuilderController } from '../controllers/form.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', formController.list);
router.get('/:id', formController.getById);

const builderRouter = Router();
builderRouter.get('/', authenticate, authorize('super_admin', 'admin'), formBuilderController.list);
builderRouter.post('/sync', authenticate, authorize('super_admin', 'admin'), formBuilderController.sync);
builderRouter.get('/:id/versions/:version', authenticate, authorize('super_admin', 'admin'), formBuilderController.getVersion);
builderRouter.get('/:id/versions', authenticate, authorize('super_admin', 'admin'), formBuilderController.listVersions);
builderRouter.get('/:id', authenticate, authorize('super_admin', 'admin'), formBuilderController.getById);
builderRouter.post('/', authenticate, authorize('super_admin', 'admin'), formBuilderController.save);
builderRouter.put('/:id', authenticate, authorize('super_admin', 'admin'), formBuilderController.save);

export { router as formRoutes, builderRouter as formBuilderRoutes };
