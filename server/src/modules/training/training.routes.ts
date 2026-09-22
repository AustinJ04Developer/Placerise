import { Router } from 'express';
import { TrainingController } from './training.controller.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createProgramSchema,
  updateProgramSchema,
  extendProgramSchema,
  createSessionSchema,
} from '../../validation/training.validation.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', TrainingController.getCategories);
router.post(
  '/categories',
  requireRoles(ROLES.PLACEMENT_OFFICER),
  TrainingController.createCategory
);

// Programs
router.get('/programs', TrainingController.getPrograms);
router.post(
  '/programs/bulk-import',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.bulkImportPrograms
);
router.get('/programs/:id', TrainingController.getProgramById);
router.post(
  '/programs',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  validateRequest(createProgramSchema),
  TrainingController.createProgram
);
router.patch(
  '/programs/:id',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  validateRequest(updateProgramSchema),
  TrainingController.updateProgram
);
router.delete(
  '/programs/:id',
  requireRoles(ROLES.PLACEMENT_OFFICER),
  TrainingController.deleteProgram
);

// Duration Extension & Session Auto-Generation
router.post(
  '/programs/:id/extend',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  validateRequest(extendProgramSchema),
  TrainingController.extendProgram
);
router.post(
  '/programs/:id/generate-sessions',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.autoGenerateSessions
);
router.post(
  '/programs/:id/sessions/quick-add',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.quickAddSession
);

// Reverse Training Query: "Who has NOT attended this training?"
router.get('/programs/:id/participation-status', TrainingController.getParticipationStatus);

// Enrollments & Assignments (Selective Students, Section, Department, Interdepartment)
router.get('/programs/:id/enrollments', TrainingController.getEnrollments);
router.post(
  '/programs/:id/assign',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.assignProgram
);
router.delete(
  '/programs/:id/enrollments/:studentId',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.unenrollStudent
);

// Sessions
router.get('/programs/:programId/sessions', TrainingController.getSessions);
router.post(
  '/programs/:programId/sessions',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.createSession
);
router.patch(
  '/programs/:programId/sessions/:sessionId',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.updateSession
);
router.delete(
  '/programs/:programId/sessions/:sessionId',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  TrainingController.deleteSession
);

export const trainingRoutes = router;
