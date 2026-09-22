import { Types } from 'mongoose';
import { Student } from '../../models/Student.js';
import { StudentAcademicHistory } from '../../models/StudentAcademicHistory.js';
import { TrainingEnrollment } from '../../models/TrainingEnrollment.js';
import { AttendanceRecord } from '../../models/AttendanceRecord.js';
import { AssessmentResult } from '../../models/AssessmentResult.js';
import { PlacementProfile } from '../../models/PlacementProfile.js';
import { TrainingProgram } from '../../models/TrainingProgram.js';
import { TrainingSession } from '../../models/TrainingSession.js';
import { Assessment } from '../../models/Assessment.js';

export class StudentsService {
  static async getStudents(filter: {
    departmentId?: string;
    batchId?: string;
    currentClassSectionId?: string;
    yearOfStudy?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    if (filter.departmentId) query.departmentId = filter.departmentId;
    if (filter.batchId) query.batchId = filter.batchId;
    if (filter.currentClassSectionId) query.currentClassSectionId = filter.currentClassSectionId;
    if (filter.yearOfStudy) query.currentYearOfStudy = Number(filter.yearOfStudy);

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { registerNumber: { $regex: filter.search, $options: 'i' } },
        { rollNumber: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('departmentId', 'code name')
        .populate('batchId', 'name')
        .populate('currentClassSectionId', 'displayName section yearOfStudy')
        .sort({ registerNumber: 1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(query),
    ]);

    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getStudentById(id: string) {
    const student = await Student.findById(id)
      .populate('departmentId')
      .populate('batchId')
      .populate('currentClassSectionId');

    if (!student) return null;

    const [academicHistory, placementProfile] = await Promise.all([
      StudentAcademicHistory.find({ studentId: student._id })
        .populate('academicYearId', 'name isCurrent order')
        .populate('classSectionId', 'displayName section')
        .sort({ yearOfStudy: 1 }),
      PlacementProfile.findOne({ studentId: student._id }),
    ]);

    return {
      student,
      academicHistory,
      placementProfile,
    };
  }

  /**
   * CRITICAL REQUIREMENT:
   * Returns complete 4-year training journey for an individual student.
   * Year 1 -> Year 2 -> Year 3 -> Year 4
   */
  static async getStudentTrainingJourney(studentId: string) {
    const student = await Student.findById(studentId)
      .populate('departmentId')
      .populate('batchId')
      .populate('currentClassSectionId');

    if (!student) {
      throw new Error('Student not found');
    }

    // 1. Get student academic history
    const academicHistory = await StudentAcademicHistory.find({ studentId: student._id })
      .populate('academicYearId')
      .populate('classSectionId')
      .sort({ yearOfStudy: 1 });

    // 2. Get all enrollments for this student
    const enrollments = await TrainingEnrollment.find({ studentId: student._id })
      .populate({
        path: 'trainingProgramId',
        populate: [{ path: 'categoryId' }, { path: 'academicYearId' }],
      })
      .populate('academicYearId');

    // 3. Get all attendance records for this student
    const attendanceRecords = await AttendanceRecord.find({ studentId: student._id })
      .populate('trainingSessionId')
      .populate('trainingProgramId', 'title code');

    // 4. Get all assessment results for this student
    const assessmentResults = await AssessmentResult.find({ studentId: student._id })
      .populate('assessmentId')
      .populate('trainingProgramId', 'title code');

    // 5. Structure into 4 years (Year 1, 2, 3, 4)
    const yearsJourney: Record<number, any> = {
      1: { yearOfStudy: 1, academicYear: null, classSection: null, programs: [] },
      2: { yearOfStudy: 2, academicYear: null, classSection: null, programs: [] },
      3: { yearOfStudy: 3, academicYear: null, classSection: null, programs: [] },
      4: { yearOfStudy: 4, academicYear: null, classSection: null, programs: [] },
    };

    academicHistory.forEach((hist) => {
      const yr = hist.yearOfStudy;
      if (yearsJourney[yr]) {
        yearsJourney[yr].academicYear = hist.academicYearId;
        yearsJourney[yr].classSection = hist.classSectionId;
        yearsJourney[yr].sectionName = hist.section;
        yearsJourney[yr].rollNumber = hist.rollNumber;
      }
    });

    // Populate programs per year of study
    enrollments.forEach((enrollment) => {
      const yr = enrollment.yearOfStudy;
      const program = enrollment.trainingProgramId as any;
      if (!program) return;

      const programAttendance = attendanceRecords.filter(
        (att) => att.trainingProgramId && att.trainingProgramId._id.toString() === program._id.toString()
      );
      const programAssessments = assessmentResults.filter(
        (asst) => asst.trainingProgramId && asst.trainingProgramId._id.toString() === program._id.toString()
      );

      const presentCount = programAttendance.filter(
        (a) => a.status === 'Present' || a.status === 'Late'
      ).length;
      const totalSessions = programAttendance.length;
      const computedAttendanceRate =
        totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : enrollment.attendancePercentage;

      if (yearsJourney[yr]) {
        yearsJourney[yr].programs.push({
          enrollmentId: enrollment._id,
          programId: program._id,
          title: program.title,
          code: program.code,
          category: program.categoryId,
          trainerName: program.trainerName,
          status: enrollment.status,
          attendancePercentage: computedAttendanceRate,
          totalSessions,
          attendedSessions: presentCount,
          minAttendanceThreshold: program.minAttendanceThreshold || 75,
          hasAttendanceGap: computedAttendanceRate < (program.minAttendanceThreshold || 75),
          assessments: programAssessments.map((a: any) => ({
            resultId: a._id,
            title: a.assessmentId ? a.assessmentId.title : 'Assessment',
            type: a.assessmentId ? a.assessmentId.type : 'Quiz',
            marksObtained: a.marksObtained,
            maxMarks: a.maxMarks,
            percentage: a.percentage,
            grade: a.grade,
            status: a.status,
          })),
        });
      }
    });

    // Calculate overall stats & identify gaps
    let totalAssigned = 0;
    let totalCompleted = 0;
    let attendanceSum = 0;
    let attendanceCount = 0;
    const trainingGaps: string[] = [];

    Object.values(yearsJourney).forEach((yrData: any) => {
      yrData.programs.forEach((prog: any) => {
        totalAssigned++;
        if (prog.status === 'Completed') {
          totalCompleted++;
        }
        if (prog.status === 'Incomplete' || prog.status === 'Dropped' || prog.hasAttendanceGap) {
          trainingGaps.push(`Year ${yrData.yearOfStudy}: ${prog.title}`);
        }
        attendanceSum += prog.attendancePercentage;
        attendanceCount++;
      });
    });

    const averageAttendance = attendanceCount > 0 ? Math.round(attendanceSum / attendanceCount) : 0;
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    const { PlacementProfile } = await import('../../models/PlacementProfile.js');
    const placementProfile = await PlacementProfile.findOne({ studentId: student._id });

    return {
      student,
      placementProfile,
      overallStats: {
        totalAssigned,
        totalCompleted,
        completionRate,
        averageAttendance,
        totalGapsCount: trainingGaps.length,
      },
      trainingGaps,
      journey: Object.values(yearsJourney),
    };
  }

  /**
   * CLASS-LEVEL TRAINING MATRIX
   * For IV CSE A (50 students):
   * Matrix where rows = students, columns = training programs.
   */
  static async getClassTrainingMatrix(classSectionId: string) {
    const section = await Student.find({ currentClassSectionId: classSectionId, status: 'Active' })
      .populate('departmentId', 'code name')
      .sort({ rollNumber: 1, registerNumber: 1 });

    const studentIds = section.map((s) => s._id);

    // Get all enrollments for these students
    const enrollments = await TrainingEnrollment.find({ studentId: { $in: studentIds } })
      .populate({
        path: 'trainingProgramId',
        populate: { path: 'categoryId', select: 'name code color' },
      })
      .populate('academicYearId', 'name');

    // Extract unique training programs
    const programsMap = new Map<string, any>();
    enrollments.forEach((e) => {
      const prog = e.trainingProgramId as any;
      if (prog && !programsMap.has(prog._id.toString())) {
        programsMap.set(prog._id.toString(), {
          id: prog._id,
          title: prog.title,
          code: prog.code,
          category: prog.categoryId?.name || 'General',
          color: prog.categoryId?.color || '#0284c7',
          targetYears: prog.targetYears,
          minAttendanceThreshold: prog.minAttendanceThreshold || 75,
        });
      }
    });

    const trainingPrograms = Array.from(programsMap.values());

    // Map student ID to their enrollments
    const studentMatrix = section.map((st) => {
      const stEnrollments = enrollments.filter(
        (e) => e.studentId.toString() === st._id.toString()
      );

      const programStatuses: Record<string, any> = {};
      let studentCompletedCount = 0;
      let studentTotalAttendance = 0;

      trainingPrograms.forEach((prog) => {
        const enr = stEnrollments.find(
          (e) => (e.trainingProgramId as any)?._id.toString() === prog.id.toString()
        );

        if (!enr) {
          programStatuses[prog.id] = {
            enrolled: false,
            status: 'Not Assigned',
            attendancePercentage: 0,
            hasGap: false,
          };
        } else {
          if (enr.status === 'Completed') studentCompletedCount++;
          studentTotalAttendance += enr.attendancePercentage;

          programStatuses[prog.id] = {
            enrolled: true,
            status: enr.status,
            attendancePercentage: enr.attendancePercentage,
            assessmentAverage: enr.assessmentAverage,
            hasGap: enr.hasGap || enr.attendancePercentage < prog.minAttendanceThreshold,
          };
        }
      });

      const assignedProgramsCount = stEnrollments.length;
      const avgAttendance =
        assignedProgramsCount > 0
          ? Math.round(studentTotalAttendance / assignedProgramsCount)
          : 0;

      return {
        student: {
          id: st._id,
          name: st.name,
          registerNumber: st.registerNumber,
          rollNumber: st.rollNumber,
          email: st.email,
        },
        programs: programStatuses,
        summary: {
          totalAssigned: assignedProgramsCount,
          completed: studentCompletedCount,
          completionPercentage:
            assignedProgramsCount > 0
              ? Math.round((studentCompletedCount / assignedProgramsCount) * 100)
              : 0,
          averageAttendance: avgAttendance,
          hasHighRisk: avgAttendance < 75,
        },
      };
    });

    return {
      totalStudents: section.length,
      programs: trainingPrograms,
      matrix: studentMatrix,
    };
  }

  /**
   * FACTUAL STUDENT COMPARISON
   * Allows comparing 2 or more students side by side without subjective labels
   */
  static async compareStudents(studentIds: string[]) {
    const comparisons = await Promise.all(
      studentIds.map(async (id) => {
        const journey = await this.getStudentTrainingJourney(id);
        const profile = await PlacementProfile.findOne({ studentId: id });
        return {
          id,
          name: journey.student.name,
          registerNumber: journey.student.registerNumber,
          rollNumber: journey.student.rollNumber,
          department: (journey.student.departmentId as any)?.code || '',
          yearOfStudy: journey.student.currentYearOfStudy,
          section: journey.student.currentSection,
          stats: journey.overallStats,
          cgpa: profile?.cgpa || 0,
          activeBacklogs: profile?.activeBacklogs || 0,
          skillsCount: profile?.skills?.length || 0,
          skills: profile?.skills || [],
          gaps: journey.trainingGaps,
          readinessScore: profile?.readinessScore || 0,
        };
      })
    );

    return comparisons;
  }

  /**
   * CREATE SINGLE STUDENT RECORD
   * Added by Placement Officer, HOD, or Class Incharge (No user account created)
   */
  static async createStudent(data: {
    registerNumber: string;
    rollNumber: string;
    name: string;
    email: string;
    gender?: 'Male' | 'Female' | 'Other';
    phone?: string;
    departmentId: string;
    batchId: string;
    currentClassSectionId: string;
    currentYearOfStudy: number;
    currentSection: string;
    githubUrl?: string;
    linkedinUrl?: string;
    leetcodeUrl?: string;
  }) {
    const regNo = data.registerNumber.trim().toUpperCase();
    const email = data.email.trim().toLowerCase();

    const existing = await Student.findOne({
      $or: [{ registerNumber: regNo }, { email }],
    });
    if (existing) {
      if (existing.registerNumber === regNo) {
        throw new Error(`Student with register number "${regNo}" already exists.`);
      }
      throw new Error(`Student with email "${email}" already exists.`);
    }

    const student = await Student.create({
      registerNumber: regNo,
      rollNumber: data.rollNumber.trim(),
      name: data.name.trim(),
      email,
      gender: data.gender || 'Male',
      phone: data.phone?.trim(),
      departmentId: new Types.ObjectId(data.departmentId),
      batchId: new Types.ObjectId(data.batchId),
      currentClassSectionId: new Types.ObjectId(data.currentClassSectionId),
      currentYearOfStudy: Number(data.currentYearOfStudy),
      currentSection: data.currentSection.trim().toUpperCase(),
      githubUrl: data.githubUrl?.trim() || undefined,
      linkedinUrl: data.linkedinUrl?.trim() || undefined,
      leetcodeUrl: data.leetcodeUrl?.trim() || undefined,
      status: 'Active',
    });

    await PlacementProfile.create({
      studentId: student._id,
      cgpa: 0,
      activeBacklogs: 0,
      historyOfBacklogs: 0,
      githubUrl: data.githubUrl?.trim() || undefined,
      linkedinUrl: data.linkedinUrl?.trim() || undefined,
      leetcodeUrl: data.leetcodeUrl?.trim() || undefined,
      preferredRoles: [],
      skills: [],
      certifications: [],
      readinessScore: 0,
      placementStatus: 'Not Placed',
    });

    return student;
  }

  /**
   * BULK IMPORT STUDENTS FROM CSV
   * Directly enrolled into Department, Batch, Year, and Section (No student user accounts)
   */
  static async bulkImportStudents(
    studentsData: Array<{
      registerNumber: string;
      rollNumber: string;
      name: string;
      email: string;
      gender?: 'Male' | 'Female' | 'Other';
      phone?: string;
      githubUrl?: string;
      linkedinUrl?: string;
      leetcodeUrl?: string;
    }>,
    targetInfo: {
      departmentId: string;
      batchId: string;
      currentClassSectionId: string;
      currentYearOfStudy: number;
      currentSection: string;
    }
  ) {
    let importedCount = 0;
    const skippedList: Array<{ registerNumber: string; name: string; reason: string }> = [];

    const existingRegNos = new Set(
      (await Student.find({}, 'registerNumber')).map((s) => s.registerNumber.toUpperCase())
    );
    const existingEmails = new Set(
      (await Student.find({}, 'email')).map((s) => s.email.toLowerCase())
    );

    const studentsToInsert: any[] = [];
    const profilesToInsert: any[] = [];

    for (const item of studentsData) {
      const regNo = item.registerNumber ? String(item.registerNumber).trim().toUpperCase() : '';
      const email = item.email ? String(item.email).trim().toLowerCase() : '';
      const name = item.name ? String(item.name).trim() : '';
      const rollNo = item.rollNumber ? String(item.rollNumber).trim() : '';

      if (!regNo || !name || !email) {
        skippedList.push({
          registerNumber: regNo || 'N/A',
          name: name || 'N/A',
          reason: 'Missing required field (Register Number, Name, or Email)',
        });
        continue;
      }

      if (existingRegNos.has(regNo)) {
        skippedList.push({
          registerNumber: regNo,
          name,
          reason: 'Register number already exists in system',
        });
        continue;
      }

      if (existingEmails.has(email)) {
        skippedList.push({
          registerNumber: regNo,
          name,
          reason: 'Email already exists in system',
        });
        continue;
      }

      existingRegNos.add(regNo);
      existingEmails.add(email);

      const studentId = new Types.ObjectId();
      studentsToInsert.push({
        _id: studentId,
        registerNumber: regNo,
        rollNumber: rollNo || regNo.slice(-3) || '01',
        name,
        email,
        gender: item.gender && ['Male', 'Female', 'Other'].includes(item.gender) ? item.gender : 'Male',
        phone: item.phone?.trim() || undefined,
        departmentId: new Types.ObjectId(targetInfo.departmentId),
        batchId: new Types.ObjectId(targetInfo.batchId),
        currentClassSectionId: new Types.ObjectId(targetInfo.currentClassSectionId),
        currentYearOfStudy: Number(targetInfo.currentYearOfStudy),
        currentSection: targetInfo.currentSection.trim().toUpperCase(),
        githubUrl: item.githubUrl?.trim() || undefined,
        linkedinUrl: item.linkedinUrl?.trim() || undefined,
        leetcodeUrl: item.leetcodeUrl?.trim() || undefined,
        status: 'Active',
      });

      profilesToInsert.push({
        studentId,
        cgpa: 0,
        activeBacklogs: 0,
        historyOfBacklogs: 0,
        githubUrl: item.githubUrl?.trim() || undefined,
        linkedinUrl: item.linkedinUrl?.trim() || undefined,
        leetcodeUrl: item.leetcodeUrl?.trim() || undefined,
        preferredRoles: [],
        skills: [],
        certifications: [],
        readinessScore: 0,
        placementStatus: 'Not Placed',
      });

      importedCount++;
    }

    if (studentsToInsert.length > 0) {
      await Student.insertMany(studentsToInsert);
      await PlacementProfile.insertMany(profilesToInsert);
    }

    return {
      success: true,
      importedCount,
      skippedCount: skippedList.length,
      skippedList,
    };
  }
}
