import { Request, Response } from 'express';
import { AcademicsService } from './academics.service.js';
import { AcademicYear } from '../../models/AcademicYear.js';
import { Department } from '../../models/Department.js';
import { Batch } from '../../models/Batch.js';
import { ClassSection } from '../../models/ClassSection.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

export class AcademicsController {
  static async getAcademicYears(req: Request, res: Response): Promise<void> {
    const years = await AcademicsService.getAcademicYears();
    res.json({ success: true, data: years });
  }

  static async getDepartments(req: Request, res: Response): Promise<void> {
    const departments = await AcademicsService.getDepartments();
    res.json({ success: true, data: departments });
  }

  static async getBatches(req: Request, res: Response): Promise<void> {
    const batches = await AcademicsService.getBatches();
    res.json({ success: true, data: batches });
  }

  static async getClassSections(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthRequest).user;
    let { academicYearId, departmentId, yearOfStudy, batchId } = req.query;

    // HOD is strictly scoped to their assigned academic department
    if (authUser?.role === ROLES.HOD && authUser.departmentId) {
      departmentId = authUser.departmentId.toString();
    }

    const sections = await AcademicsService.getClassSections({
      academicYearId: academicYearId as string,
      departmentId: departmentId as string,
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      batchId: batchId as string,
    });
    res.json({ success: true, data: sections });
  }

  static async getSectionById(req: Request, res: Response): Promise<void> {
    const section = await AcademicsService.getSectionById(req.params.id);
    if (!section) {
      res.status(404).json({ success: false, message: 'Class section not found' });
      return;
    }
    res.json({ success: true, data: section });
  }

  static async getStudentsBySection(req: Request, res: Response): Promise<void> {
    const students = await AcademicsService.getStudentsBySection(
      req.params.id,
      req.query.search as string
    );
    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  }

  static async createDepartment(req: Request, res: Response): Promise<void> {
    const { code, name } = req.body;
    const dept = await Department.create({ code: code.toUpperCase(), name });
    res.status(201).json({ success: true, data: dept });
  }

  static async createAcademicYear(req: Request, res: Response): Promise<void> {
    const { name, startDate, endDate, isCurrent, order } = req.body;
    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }
    const year = await AcademicYear.create({ name, startDate, endDate, isCurrent, order });
    res.status(201).json({ success: true, data: year });
  }

  static async createClassSection(req: Request, res: Response): Promise<void> {
    const { academicYearId, departmentId, batchId, yearOfStudy, section, facultyInchargeId, displayName } = req.body;
    const classSection = await ClassSection.create({
      academicYearId,
      departmentId,
      batchId,
      yearOfStudy,
      section,
      facultyInchargeId,
      displayName,
    });
    res.status(201).json({ success: true, data: classSection });
  }
}
