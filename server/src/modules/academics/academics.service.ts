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
    let depts = await Department.find({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    }).sort({ code: 1 });

    if (!depts || depts.length === 0) {
      // Auto-initialize standard 7 departments if database has none
      const defaultDepts = [
        { code: 'CSE', name: 'Computer Science and Engineering', isActive: true },
        { code: 'AIDS', name: 'Artificial Intelligence and Data Science', isActive: true },
        { code: 'ECE', name: 'Electronics and Communication Engineering', isActive: true },
        { code: 'EEE', name: 'Electrical and Electronics Engineering', isActive: true },
        { code: 'MECH', name: 'Mechanical Engineering', isActive: true },
        { code: 'CIVIL', name: 'Civil Engineering', isActive: true },
        { code: 'MBA', name: 'Master of Business Administration', isActive: true },
      ];
      try {
        await Department.insertMany(defaultDepts, { ordered: false });
      } catch (e) {
        // Ignore duplicate key errors if race condition
      }
      depts = await Department.find().sort({ code: 1 });
    }

    return depts;
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

    let sections = await ClassSection.find(query)
      .populate('academicYearId', 'name isCurrent')
      .populate('departmentId', 'code name')
      .populate('batchId', 'name startYear endYear')
      .populate('facultyInchargeId', 'name email')
      .sort({ yearOfStudy: 1, section: 1 });

    // If specific department was requested and has no sections, auto-create standard sections (Years 1-4 Section A)
    if (sections.length === 0 && filter.departmentId) {
      try {
        const dept = await Department.findById(filter.departmentId);
        if (dept) {
          let currYear = await AcademicYear.findOne({ isCurrent: true });
          if (!currYear) {
            currYear = await AcademicYear.create({
              name: '2026-27',
              startDate: new Date('2026-07-01'),
              endDate: new Date('2027-05-31'),
              isCurrent: true,
              order: 4,
            });
          }
          let batch = await Batch.findOne({ isActive: true });
          if (!batch) {
            batch = await Batch.create({
              name: '2023-2027',
              startYear: 2023,
              endYear: 2027,
              isActive: true,
            });
          }

          const isMba = dept.code === 'MBA';
          const maxYears = isMba ? 2 : 4;
          const romanYears = ['I', 'II', 'III', 'IV'];
          for (let yr = 1; yr <= maxYears; yr++) {
            const displayName = `${romanYears[yr - 1]} ${dept.code} A`;
            await ClassSection.create({
              academicYearId: currYear._id,
              departmentId: dept._id,
              batchId: batch._id,
              yearOfStudy: yr,
              section: 'A',
              displayName,
            });
          }

          sections = await ClassSection.find(query)
            .populate('academicYearId', 'name isCurrent')
            .populate('departmentId', 'code name')
            .populate('batchId', 'name startYear endYear')
            .populate('facultyInchargeId', 'name email')
            .sort({ yearOfStudy: 1, section: 1 });
        }
      } catch (err) {
        console.error('Failed to auto-seed sections for department', err);
      }
    }

    return sections;
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
