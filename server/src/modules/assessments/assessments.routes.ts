import { Router } from 'express';
import { AssessmentsController } from './assessments.controller.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY),
  AssessmentsController.createAssessment
);

router.get('/program/:programId', AssessmentsController.getByProgram);
router.get('/:id/roster', AssessmentsController.getAssessmentRoster);

router.post(
  '/:id/bulk-results',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY),
  AssessmentsController.submitBulkResults
);

export const assessmentsRoutes = router;
