import { Router } from 'express';
import { StudentsController } from './students.controller.js';
import { authenticate, enforceStudentAccess, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  StudentsController.getStudents
);
router.get(
  '/matrix/:sectionId',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  StudentsController.getClassTrainingMatrix
);
router.post(
  '/',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.CLASS_INCHARGE),
  StudentsController.createStudent
);
router.post(
  '/bulk-import',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.CLASS_INCHARGE),
  StudentsController.bulkImportStudents
);
router.post(
  '/compare',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  StudentsController.compareStudents
);

// Student profile & journey
router.get('/:id', enforceStudentAccess, StudentsController.getStudentById);
router.get('/:id/training-history', enforceStudentAccess, StudentsController.getStudentTrainingJourney);
router.patch(
  '/:studentId/placement-profile',
  enforceStudentAccess,
  StudentsController.updatePlacementProfile
);

export const studentsRoutes = router;
