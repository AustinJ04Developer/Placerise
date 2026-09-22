import { AcademicYear } from '../../models/AcademicYear.js';
import { Department } from '../../models/Department.js';
import { Batch } from '../../models/Batch.js';
import { ClassSection } from '../../models/ClassSection.js';
import { Student } from '../../models/Student.js';

export class AcademicsService {
  static async getAcademicYears() {
    return AcademicYear.find().sort({ order: 1, name: 1 });
  }

  static async getDepartments() {
    return Department.find({ isActive: true }).sort({ code: 1 });
  }

  static async getBatches() {
    return Batch.find({ isActive: true }).sort({ startYear: -1 });
  }

  static async getClassSections(filter: {
    academicYearId?: string;
    departmentId?: string;
    yearOfStudy?: number;
    batchId?: string;
  }) {
    const query: any = {};
    if (filter.academicYearId) query.academicYearId = filter.academicYearId;
    if (filter.departmentId) query.departmentId = filter.departmentId;
    if (filter.yearOfStudy) query.yearOfStudy = Number(filter.yearOfStudy);
    if (filter.batchId) query.batchId = filter.batchId;

    return ClassSection.find(query)
      .populate('academicYearId', 'name isCurrent')
      .populate('departmentId', 'code name')
      .populate('batchId', 'name startYear endYear')
      .populate('facultyInchargeId', 'name email')
      .sort({ yearOfStudy: 1, section: 1 });
  }

  static async getSectionById(sectionId: string) {
    return ClassSection.findById(sectionId)
      .populate('academicYearId')
      .populate('departmentId')
      .populate('batchId')
      .populate('facultyInchargeId', 'name email');
  }

  static async getStudentsBySection(sectionId: string, search?: string) {
    const query: any = { currentClassSectionId: sectionId, status: 'Active' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }
    return Student.find(query)
      .populate('departmentId', 'code name')
      .populate('batchId', 'name')
      .sort({ rollNumber: 1, registerNumber: 1 });
  }
}
