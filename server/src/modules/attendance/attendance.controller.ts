import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class AttendanceController {
  static async getSessionRoster(req: Request, res: Response): Promise<void> {
    try {
      const roster = await AttendanceService.getSessionRoster(req.params.sessionId);
      res.json({ success: true, data: roster });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Error fetching roster' });
    }
  }

  static async markBulkAttendance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json({ success: false, message: 'Attendance records array is required' });
        return;
      }

      const result = await AttendanceService.markBulkAttendance({
        sessionId,
        records,
        userId: req.user!._id.toString(),
      });

      await recordAuditLog(req, {
        action: 'MARK_BULK_ATTENDANCE',
        entity: 'TrainingSession',
        entityId: sessionId,
        details: `Marked attendance for ${records.length} students in session ${sessionId}`,
      });

      res.json({
        success: true,
        message: `Successfully marked attendance for ${records.length} students`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error marking attendance' });
    }
  }
}
