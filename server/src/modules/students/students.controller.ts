import { Request, Response } from 'express';
import { StudentsService } from './students.service.js';
import { PlacementProfile } from '../../models/PlacementProfile.js';
import { ClassSection } from '../../models/ClassSection.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

export class StudentsController {
  static async getStudents(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthRequest).user;
    let { departmentId, batchId, currentClassSectionId, yearOfStudy, search, page, limit } = req.query;

    // If caller is HOD, restrict to their department only
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      departmentId = authUser.departmentId.toString();
    }

    const result = await StudentsService.getStudents({
      departmentId: departmentId as string,
      batchId: batchId as string,
      currentClassSectionId: currentClassSectionId as string,
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, data: result.students, pagination: result.pagination });
  }

  static async getStudentById(req: AuthRequest, res: Response): Promise<void> {
    const studentId = req.params.id === 'me' ? req.user?.studentId?.toString() : req.params.id;
    if (!studentId) {
      res.status(404).json({ success: false, message: 'No student linked to this account' });
      return;
    }
    const result = await StudentsService.getStudentById(studentId);
    if (!result) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }
    res.json({ success: true, data: result });
  }

  static async getStudentTrainingJourney(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.params.id === 'me' ? req.user?.studentId?.toString() : req.params.id;
      if (!studentId) {
        res.status(404).json({ success: false, message: 'No student linked to this account' });
        return;
      }
      const journey = await StudentsService.getStudentTrainingJourney(studentId);
      res.json({ success: true, data: journey });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Error fetching journey' });
    }
  }

  static async getClassTrainingMatrix(req: Request, res: Response): Promise<void> {
    const { sectionId } = req.params;
    const authUser = (req as AuthRequest).user;
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      const section = await ClassSection.findById(sectionId);
      if (section && section.departmentId.toString() !== authUser.departmentId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: HOD can only access classes in their own department',
        });
        return;
      }
    }
    const matrix = await StudentsService.getClassTrainingMatrix(sectionId);
    res.json({ success: true, data: matrix });
  }

  static async compareStudents(req: Request, res: Response): Promise<void> {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length < 2) {
      res.status(400).json({ success: false, message: 'Please provide at least 2 student IDs to compare' });
      return;
    }
    const comparison = await StudentsService.compareStudents(studentIds);
    res.json({ success: true, data: comparison });
  }

  static async updatePlacementProfile(req: AuthRequest, res: Response): Promise<void> {
    const { studentId } = req.params;
    const updateData = req.body;

    const previousProfile = await PlacementProfile.findOne({ studentId });
    const profile = await PlacementProfile.findOneAndUpdate(
      { studentId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    await recordAuditLog(req, {
      action: 'UPDATE_PLACEMENT_PROFILE',
      entity: 'PlacementProfile',
      entityId: profile._id,
      previousValue: previousProfile,
      newValue: profile,
      details: `Placement profile updated for student ${studentId}`,
    });

    res.json({ success: true, data: profile });
  }

  static async createStudent(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthRequest).user;
    const body = req.body;

    // HOD department scoping enforcement
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      if (body.departmentId && body.departmentId.toString() !== authUser.departmentId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: HOD can only add students to their own department',
        });
        return;
      }
      body.departmentId = authUser.departmentId;
    }

    try {
      const student = await StudentsService.createStudent(body);

      await recordAuditLog(req as AuthRequest, {
        action: 'CREATE_STUDENT',
        entity: 'Student',
        entityId: student._id,
        newValue: { registerNumber: student.registerNumber, name: student.name, email: student.email },
        details: `Student ${student.registerNumber} (${student.name}) enrolled in department ${student.departmentId}`,
      });

      res.status(201).json({ success: true, data: student, message: 'Student created successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create student' });
    }
  }

  static async bulkImportStudents(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthRequest).user;
    const { students, targetInfo } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, message: 'No student records provided for import' });
      return;
    }

    if (!targetInfo?.departmentId || !targetInfo?.batchId || !targetInfo?.currentClassSectionId) {
      res.status(400).json({ success: false, message: 'Missing target department, batch, or section details' });
      return;
    }

    // HOD department scoping enforcement
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      if (targetInfo.departmentId.toString() !== authUser.departmentId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: HOD can only import students into their own department',
        });
        return;
      }
    }

    try {
      const result = await StudentsService.bulkImportStudents(students, targetInfo);

      await recordAuditLog(req as AuthRequest, {
        action: 'BULK_IMPORT_STUDENTS',
        entity: 'Student',
        details: `Bulk imported ${result.importedCount} students (skipped ${result.skippedCount}) into section ${targetInfo.currentClassSectionId}`,
      });

      res.json({
        success: true,
        data: result,
        message: `Successfully imported ${result.importedCount} students${result.skippedCount > 0 ? ` (${result.skippedCount} skipped)` : ''}`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to bulk import students' });
    }
  }
}
