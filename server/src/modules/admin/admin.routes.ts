import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles(ROLES.PLACEMENT_OFFICER));

router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);
router.put('/keys', AdminController.updateKeys);
router.post('/keys/rotate', AdminController.rotateKey);

router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);

router.get('/stats', AdminController.getSystemStats);

export const adminRoutes = router;
