import { Router } from 'express';
import { ApprovalsController } from './approvals.controller.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.post('/', ApprovalsController.createRequest);
router.get('/', ApprovalsController.getRequests);
router.patch(
  '/:id/review',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD),
  ApprovalsController.reviewRequest
);

export const approvalsRoutes = router;
