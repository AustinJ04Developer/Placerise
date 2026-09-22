import { Router } from 'express';
import { AttendanceController } from './attendance.controller.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/session/:sessionId/roster', AttendanceController.getSessionRoster);
router.post(
  '/session/:sessionId/bulk',
  requireRoles(ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.FACULTY, ROLES.CLASS_INCHARGE),
  AttendanceController.markBulkAttendance
);

export const attendanceRoutes = router;
