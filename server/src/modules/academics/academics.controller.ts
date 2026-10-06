import { Request, Response } from 'express';
import { AcademicsService } from './academics.service.js';
import { AcademicYear } from '../../models/AcademicYear.js';
import { Department } from '../../models/Department.js';
import { Batch } from '../../models/Batch.js';
import { ClassSection } from '../../models/ClassSection.js';
import { User } from '../../models/User.js';
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
    try {
      const authUser = (req as AuthRequest).user;
      let { academicYearId, departmentId, batchId, yearOfStudy, section, facultyInchargeId, displayName, autoAssignToSelf } = req.body;

      // Default department to user's assigned department if omitted
      if (!departmentId && authUser?.departmentId) {
        departmentId =
          typeof authUser.departmentId === 'object'
            ? (authUser.departmentId as any)._id
            : authUser.departmentId;
      }

      if (!departmentId) {
        res.status(400).json({ success: false, message: 'Academic Department is required to create a class section.' });
        return;
      }

      const dept = await Department.findById(departmentId);
      if (!dept) {
        res.status(404).json({ success: false, message: 'Selected academic department not found.' });
        return;
      }

      // Default Academic Year if not provided
      if (!academicYearId) {
        let currYear = await AcademicYear.findOne({ isCurrent: true });
        if (!currYear) {
          currYear = await AcademicYear.findOne().sort({ order: -1 });
        }
        if (!currYear) {
          currYear = await AcademicYear.create({
            name: '2026-27',
            startDate: new Date('2026-07-01'),
            endDate: new Date('2027-05-31'),
            isCurrent: true,
            order: 4,
          });
        }
        academicYearId = currYear._id;
      }

      // Default Batch if not provided
      if (!batchId) {
        let activeBatch = await Batch.findOne({ isActive: true });
        if (!activeBatch) {
          activeBatch = await Batch.findOne().sort({ endYear: -1 });
        }
        if (!activeBatch) {
          activeBatch = await Batch.create({
            name: '2023-2027',
            startYear: 2023,
            endYear: 2027,
            isActive: true,
          });
        }
        batchId = activeBatch._id;
      }

      const isMba = dept.code === 'MBA';
      
      if (yearOfStudy === undefined || yearOfStudy === null || yearOfStudy === '') {
        res.status(400).json({
          success: false,
          message: 'Year of Study is a mandatory field.',
        });
        return;
      }

      const cleanYear = Number(yearOfStudy);
      if (isNaN(cleanYear) || cleanYear < 1 || (isMba ? cleanYear > 2 : cleanYear > 4)) {
        res.status(400).json({
          success: false,
          message: isMba
            ? 'MBA degree has only First and Second Year (Years 1 and 2).'
            : 'Year of Study must be between 1 and 4.',
        });
        return;
      }

      if (!section || !section.toString().trim()) {
        res.status(400).json({
          success: false,
          message: 'Section is a mandatory field. Please provide a section identifier (e.g. A, B).',
        });
        return;
      }

      const cleanSection = section.toString().trim().toUpperCase();

      if (!displayName || !displayName.trim()) {
        const romanYears = ['I', 'II', 'III', 'IV'];
        const roman = romanYears[cleanYear - 1] || `${cleanYear}`;
        displayName = `${roman} ${dept.code} ${cleanSection}`;
      } else {
        displayName = displayName.trim();
      }

      let inchargeUser = facultyInchargeId;
      if (!inchargeUser && authUser?.role === ROLES.CLASS_INCHARGE) {
        inchargeUser = authUser._id;
      }

      // Check if section already exists for this department, year, and section
      let classSection = await ClassSection.findOne({
        $or: [
          { academicYearId, departmentId: dept._id, yearOfStudy: cleanYear, section: cleanSection },
          { departmentId: dept._id, yearOfStudy: cleanYear, section: cleanSection },
        ],
      });

      if (classSection) {
        if (inchargeUser) {
          await ClassSection.updateMany(
            { facultyInchargeId: inchargeUser, _id: { $ne: classSection._id } },
            { $unset: { facultyInchargeId: 1 } }
          );
          await ClassSection.findByIdAndUpdate(classSection._id, { facultyInchargeId: inchargeUser });
        }
      } else {
        classSection = await ClassSection.create({
          academicYearId,
          departmentId: dept._id,
          batchId,
          yearOfStudy: cleanYear,
          section: cleanSection,
          facultyInchargeId: inchargeUser,
          displayName,
        });
      }

      // If user requested auto-assign or is Class Incharge creating their class section
      if (authUser && (autoAssignToSelf || authUser.role === ROLES.CLASS_INCHARGE)) {
        await User.findByIdAndUpdate(authUser._id, {
          assignedSectionId: classSection._id,
          departmentId: dept._id,
        });
      }

      const populatedSection = await ClassSection.findById(classSection._id)
        .populate('academicYearId', 'name isCurrent')
        .populate('departmentId', 'code name')
        .populate('batchId', 'name startYear endYear')
        .populate('facultyInchargeId', 'name email');

      res.status(201).json({
        success: true,
        message: `Class section ${displayName} created successfully!`,
        data: populatedSection,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to create class section',
      });
    }
  }
}
