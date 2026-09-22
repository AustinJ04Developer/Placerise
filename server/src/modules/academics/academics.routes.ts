import { Router } from 'express';
import { AcademicsController } from './academics.controller.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/academic-years', AcademicsController.getAcademicYears);
router.get('/departments', AcademicsController.getDepartments);
router.get('/batches', AcademicsController.getBatches);
router.get('/sections', AcademicsController.getClassSections);
router.get('/sections/:id', AcademicsController.getSectionById);
router.get(
  '/sections/:id/students',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  AcademicsController.getStudentsBySection
);

// Admin-only creation endpoints
router.post(
  '/departments',
  requireRoles(ROLES.PLACEMENT_OFFICER),
  AcademicsController.createDepartment
);
router.post(
  '/academic-years',
  requireRoles(ROLES.PLACEMENT_OFFICER),
  AcademicsController.createAcademicYear
);
router.post(
  '/sections',
  requireRoles(ROLES.PLACEMENT_OFFICER),
  AcademicsController.createClassSection
);

export const academicsRoutes = router;
