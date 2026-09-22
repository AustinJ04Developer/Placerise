import { Request, Response } from 'express';
import { TrainingService } from './training.service.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

export class TrainingController {
  // Categories
  static async getCategories(req: Request, res: Response): Promise<void> {
    const categories = await TrainingService.getCategories();
    res.json({ success: true, data: categories });
  }

  static async createCategory(req: AuthRequest, res: Response): Promise<void> {
    const category = await TrainingService.createCategory(req.body);
    await recordAuditLog(req, {
      action: 'CREATE_CATEGORY',
      entity: 'TrainingCategory',
      entityId: category._id,
      newValue: category,
      details: `Created training category: ${category.name}`,
    });
    res.status(201).json({ success: true, data: category });
  }

  // Programs
  static async getPrograms(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthRequest).user;
    let { academicYearId, categoryId, yearOfStudy, batchId, status, departmentId, search } = req.query;

    // HOD gets programs targeted for their academic department
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      departmentId = authUser.departmentId.toString();
    }

    const programs = await TrainingService.getPrograms({
      academicYearId: academicYearId as string,
      categoryId: categoryId as string,
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      batchId: batchId as string,
      status: status as string,
      departmentId: departmentId as string,
      search: search as string,
    });
    res.json({ success: true, count: programs.length, data: programs });
  }

  static async getProgramById(req: Request, res: Response): Promise<void> {
    const result = await TrainingService.getProgramById(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, message: 'Training program not found' });
      return;
    }
    res.json({ success: true, data: result });
  }

  static async createProgram(req: AuthRequest, res: Response): Promise<void> {
    // If HOD creates program, ensure it targets their specific department
    if (req.user?.role === ROLES.HOD && req.user.departmentId) {
      req.body.targetDepartmentIds = [req.user.departmentId];
    }

    const program = await TrainingService.createProgram(req.body);
    await recordAuditLog(req, {
      action: 'CREATE_PROGRAM',
      entity: 'TrainingProgram',
      entityId: program._id,
      newValue: program,
      details: `Created training program: ${program.title} (${program.code})`,
    });
    res.status(201).json({ success: true, data: program });
  }

  static async bulkImportPrograms(req: AuthRequest, res: Response): Promise<void> {
    const authUser = req.user;
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      if (!req.body.defaultParams) req.body.defaultParams = {};
      req.body.defaultParams.departmentId = authUser.departmentId.toString();
    }

    const result = await TrainingService.bulkImportPrograms(req.body, authUser);

    await recordAuditLog(req, {
      action: 'BULK_IMPORT_PROGRAMS',
      entity: 'TrainingProgram',
      details: `Bulk imported ${result.importedCount} training programs (${result.skippedCount} skipped)`,
      newValue: {
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
      },
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.importedCount} training programs`,
      data: result,
    });
  }

  static async updateProgram(req: AuthRequest, res: Response): Promise<void> {
    const updated = await TrainingService.updateProgram(req.params.id, req.body);
    await recordAuditLog(req, {
      action: 'UPDATE_PROGRAM',
      entity: 'TrainingProgram',
      entityId: updated?._id,
      newValue: updated,
      details: `Updated training program: ${updated?.title}`,
    });
    res.json({ success: true, data: updated });
  }

  static async deleteProgram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deleted = await TrainingService.deleteProgram(req.params.id);
      await recordAuditLog(req, {
        action: 'DELETE_PROGRAM',
        entity: 'TrainingProgram',
        entityId: deleted._id,
        previousValue: deleted,
        details: `Deleted training program: ${deleted.title} (${deleted.code})`,
      });
      res.json({ success: true, message: 'Training program deleted successfully', data: deleted });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Error deleting program' });
    }
  }


  // Duration Extension & Session Auto-Generation
  static async extendProgram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await TrainingService.extendProgramDuration(req.params.id, req.body);
      await recordAuditLog(req, {
        action: 'EXTEND_PROGRAM_DURATION',
        entity: 'TrainingProgram',
        entityId: req.params.id,
        newValue: result,
        details: `Extended program duration by ${result.addedSessions.length} session days`,
      });
      res.json({
        success: true,
        message: `Successfully extended program duration by ${result.addedSessions.length} attendance days`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error extending program duration' });
    }
  }

  static async autoGenerateSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const dailyHours = req.body.dailyHours ? Number(req.body.dailyHours) : 2;
      const forceRegenerate = Boolean(req.body.forceRegenerate);
      const result = await TrainingService.autoGenerateProgramSessions(req.params.id, dailyHours, forceRegenerate);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error generating sessions' });
    }
  }

  static async quickAddSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await TrainingService.quickAddNextSession(req.params.id, req.body.customDate);
      res.json({ success: true, message: 'Added attendance day session', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error adding attendance day' });
    }
  }

  // Sessions
  static async createSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionData = {
      ...req.body,
      trainingProgramId: req.body.trainingProgramId || req.params.programId,
    };
    const session = await TrainingService.createSession(sessionData);
    res.status(201).json({ success: true, data: session });
  }

  static async getSessions(req: Request, res: Response): Promise<void> {
    const sessions = await TrainingService.getSessionsByProgram(req.params.programId);
    res.json({ success: true, data: sessions });
  }

  static async updateSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const session = await TrainingService.updateSession(req.params.sessionId, req.body);
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error updating session' });
    }
  }

  static async deleteSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await TrainingService.deleteSession(req.params.sessionId);
      res.json({ success: true, message: 'Session deleted successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error deleting session' });
    }
  }

  // Assignment
  static async assignProgram(req: AuthRequest, res: Response): Promise<void> {
    const result = await TrainingService.assignProgramToTargets({
      programId: req.params.id,
      ...req.body,
    });
    await recordAuditLog(req, {
      action: 'ASSIGN_TRAINING',
      entity: 'TrainingProgram',
      entityId: req.params.id,
      details: `Assigned program to ${result.newlyEnrolled} students`,
    });
    res.json({ success: true, data: result });
  }

  // REVERSE TRAINING QUERY
  static async getParticipationStatus(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as AuthRequest).user;
      const deptId =
        authUser?.role === ROLES.HOD && authUser.departmentId
          ? authUser.departmentId.toString()
          : undefined;
      const result = await TrainingService.getProgramParticipationStatus(req.params.id, deptId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Error executing reverse query' });
    }
  }

  // Enrolled Students list
  static async getEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const enrollments = await TrainingService.getEnrolledStudents(req.params.id);
      res.json({ success: true, data: enrollments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching enrollments' });
    }
  }

  // Remove a student enrollment
  static async unenrollStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id, studentId } = req.params;
      await TrainingService.unenrollStudent(id, studentId);
      await recordAuditLog(req, {
        action: 'UNENROLL_STUDENT',
        entity: 'TrainingProgram',
        entityId: id,
        details: `Removed student ${studentId} from training program ${id}`,
      });
      res.json({ success: true, message: 'Student removed from program' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error removing student' });
    }
  }
}
