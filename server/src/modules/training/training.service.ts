import { Types } from 'mongoose';
import { TrainingCategory } from '../../models/TrainingCategory.js';
import { TrainingProgram } from '../../models/TrainingProgram.js';
import { TrainingSession } from '../../models/TrainingSession.js';
import { TrainingEnrollment } from '../../models/TrainingEnrollment.js';
import { AttendanceRecord } from '../../models/AttendanceRecord.js';
import { Student } from '../../models/Student.js';
import { AcademicYear } from '../../models/AcademicYear.js';
import { Department } from '../../models/Department.js';
import { Batch } from '../../models/Batch.js';
import { ENROLLMENT_STATUS, ROLES } from '../../config/constants.js';

export class TrainingService {
  // Categories
  static async getCategories() {
    return TrainingCategory.find().sort({ order: 1, name: 1 });
  }

  static async createCategory(data: { name: string; code: string; color?: string; description?: string }) {
    return TrainingCategory.create({
      ...data,
      code: data.code.toUpperCase(),
    });
  }

  // Programs
  static async getPrograms(filter: {
    academicYearId?: string;
    categoryId?: string;
    yearOfStudy?: number;
    batchId?: string;
    status?: string;
    departmentId?: string;
    search?: string;
  }) {
    const query: any = {};
    if (filter.academicYearId) query.academicYearId = filter.academicYearId;
    if (filter.categoryId) query.categoryId = filter.categoryId;
    if (filter.yearOfStudy) query.targetYears = Number(filter.yearOfStudy);
    if (filter.batchId) query.targetBatchIds = filter.batchId;
    if (filter.status) query.status = filter.status;
    if (filter.departmentId) query.targetDepartmentIds = filter.departmentId;
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { code: { $regex: filter.search, $options: 'i' } },
        { trainerName: { $regex: filter.search, $options: 'i' } },
      ];
    }

    return TrainingProgram.find(query)
      .populate('categoryId', 'name code color')
      .populate('academicYearId', 'name isCurrent')
      .populate('targetDepartmentIds', 'code name')
      .populate('targetBatchIds', 'name startYear endYear')
      .sort({ startDate: -1 });
  }

  static async getProgramById(id: string) {
    const program = await TrainingProgram.findById(id)
      .populate('categoryId')
      .populate('academicYearId')
      .populate('targetDepartmentIds')
      .populate('targetBatchIds');

    if (!program) return null;

    const sessions = await TrainingSession.find({ trainingProgramId: id }).sort({ sessionNumber: 1 });
    const enrolledCount = await TrainingEnrollment.countDocuments({ trainingProgramId: id });

    return {
      program,
      sessions,
      enrolledCount,
    };
  }

  /**
   * Helper: Generate scheduled session dates between two dates, respecting:
   * 1. Active class days of the week (default: Mon-Sat, skipping Sun)
   * 2. Excluded individual off-dates
   * 3. Gap periods (days, weeks, or months without classes)
   */
  private static generateSessionDates(
    startDate: Date,
    endDate: Date,
    options?: {
      countLimit?: number;
      classDays?: number[];
      excludedDates?: (string | Date)[];
      specialActiveDates?: (string | Date)[];
      gapPeriods?: { startDate: string | Date; endDate: string | Date; reason?: string }[];
    }
  ): Date[] {
    const dates: Date[] = [];
    const curr = new Date(startDate);
    curr.setHours(9, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const classDays = (options?.classDays && options.classDays.length > 0)
      ? options.classDays
      : [1, 2, 3, 4, 5, 6];

    const excludedDateStrings = new Set(
      (options?.excludedDates || []).map((d) => {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0];
      }).filter(Boolean)
    );

    const specialActiveDateStrings = new Set(
      (options?.specialActiveDates || []).map((d) => {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0];
      }).filter(Boolean)
    );

    const parsedGaps = (options?.gapPeriods || []).map((g) => {
      const s = new Date(g.startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(g.endDate);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }).filter((g) => !isNaN(g.start.getTime()) && !isNaN(g.end.getTime()));

    const isDateExcluded = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      // 0. Special active dates (e.g. Sunday classes or makeup sessions) ALWAYS override exclusion
      if (specialActiveDateStrings.has(dateStr)) {
        return false;
      }
      // 1. Day of week check
      if (!classDays.includes(date.getDay())) {
        return true;
      }
      // 2. Specific individual excluded date check
      if (excludedDateStrings.has(dateStr)) {
        return true;
      }
      // 3. Gap periods check (e.g. multi-day, week, or month gaps)
      for (const gap of parsedGaps) {
        if (date >= gap.start && date <= gap.end) {
          return true;
        }
      }
      return false;
    };

    while (curr <= end && (!options?.countLimit || dates.length < options.countLimit)) {
      if (!isDateExcluded(curr)) {
        dates.push(new Date(curr));
      }
      curr.setDate(curr.getDate() + 1);
    }

    // If a minimum count was requested and not reached, keep adding next valid class days
    while (options?.countLimit && dates.length < options.countLimit) {
      curr.setDate(curr.getDate() + 1);
      if (!isDateExcluded(curr)) {
        dates.push(new Date(curr));
      }
    }

    // Fallback: at least 1 date if none were generated
    if (dates.length === 0) {
      dates.push(new Date(startDate));
    }

    return dates;
  }

  static async createProgram(data: any) {
    const { dailyHours = 2, autoGenerateSessions = true, ...programData } = data;
    const program = await TrainingProgram.create(programData);

    if (autoGenerateSessions && program.startDate && program.endDate) {
      const dates = this.generateSessionDates(program.startDate, program.endDate, {
        classDays: program.classDays,
        excludedDates: program.excludedDates,
        specialActiveDates: program.specialActiveDates,
        gapPeriods: program.gapPeriods,
      });

      const sessionDocs = dates.map((date, idx) => ({
        trainingProgramId: program._id,
        sessionNumber: idx + 1,
        title: `${program.title} - Day ${idx + 1} Session`,
        sessionDate: date,
        startTime: '10:00 AM',
        endTime: `${10 + Math.floor(dailyHours)}:${dailyHours % 1 === 0.5 ? '30' : '00'} ${10 + Math.floor(dailyHours) >= 12 ? 'PM' : 'AM'}`,
        durationHours: dailyHours,
        trainer: program.trainerName,
        topicsCovered: `Trainer curriculum Day ${idx + 1} for ${program.title}`,
        isCompleted: false,
      }));

      if (sessionDocs.length > 0) {
        await TrainingSession.insertMany(sessionDocs);
        program.totalPlannedHours = sessionDocs.length * dailyHours;
        await program.save();
      }
    }

    return program;
  }

  static async updateProgram(id: string, data: any) {
    const existing = await TrainingProgram.findById(id);
    if (!existing) throw new Error('Training program not found');

    const oldEndDate = new Date(existing.endDate);
    const newEndDate = data.endDate ? new Date(data.endDate) : null;
    const dailyHours = data.dailyHours || 2;
    const regenerateSessions = data.regenerateSessions;

    const updated = await TrainingProgram.findByIdAndUpdate(id, data, { new: true });

    if (!updated) throw new Error('Failed to update training program');

    // If user requested to re-generate uncompleted sessions based on updated off-days or gaps:
    if (regenerateSessions) {
      const completedSessions = await TrainingSession.find({
        trainingProgramId: id,
        isCompleted: true,
      }).sort({ sessionNumber: 1 });

      await TrainingSession.deleteMany({
        trainingProgramId: id,
        isCompleted: false,
      });

      const completedDates = new Set(
        completedSessions.map((s) => new Date(s.sessionDate).toISOString().split('T')[0])
      );

      const allDates = this.generateSessionDates(updated.startDate, updated.endDate, {
        classDays: updated.classDays,
        excludedDates: updated.excludedDates,
        specialActiveDates: updated.specialActiveDates,
        gapPeriods: updated.gapPeriods,
      });

      const remainingDates = allDates.filter(
        (d) => !completedDates.has(d.toISOString().split('T')[0])
      );

      const startIdx = completedSessions.length;
      const newDocs = remainingDates.map((date, idx) => ({
        trainingProgramId: updated._id,
        sessionNumber: startIdx + idx + 1,
        title: `${updated.title} - Day ${startIdx + idx + 1} Session`,
        sessionDate: date,
        startTime: '10:00 AM',
        endTime: `${10 + Math.floor(dailyHours)}:${dailyHours % 1 === 0.5 ? '30' : '00'} ${10 + Math.floor(dailyHours) >= 12 ? 'PM' : 'AM'}`,
        durationHours: dailyHours,
        trainer: updated.trainerName,
        topicsCovered: `Curriculum Day ${startIdx + idx + 1} for ${updated.title}`,
        isCompleted: false,
      }));

      if (newDocs.length > 0) {
        await TrainingSession.insertMany(newDocs);
      }
      updated.totalPlannedHours = (completedSessions.length + newDocs.length) * dailyHours;
      await updated.save();
    } else if ((newEndDate && newEndDate.getTime() > oldEndDate.getTime()) || data.extendDays) {
      await this.extendProgramDuration(id, {
        newEndDate: newEndDate ? newEndDate.toISOString() : undefined,
        extendDays: data.extendDays,
        dailyHours,
      });
    }

    return updated;
  }

  /**
   * EXTENSION OF DURATION & AUTOMATIC ATTENDANCE DAYS
   * Appends new attendance day sessions to the training program schedule, respecting schedule & gaps.
   */
  static async extendProgramDuration(id: string, params: {
    extendDays?: number;
    newEndDate?: string;
    dailyHours?: number;
    remarks?: string;
  }) {
    const program = await TrainingProgram.findById(id);
    if (!program) throw new Error('Training program not found');

    const dailyHours = params.dailyHours || 2;
    const existingSessions = await TrainingSession.find({ trainingProgramId: id }).sort({ sessionNumber: 1 });
    const currentSessionCount = existingSessions.length;

    let startDateForNewSessions: Date;
    if (existingSessions.length > 0) {
      const lastSession = existingSessions[existingSessions.length - 1];
      startDateForNewSessions = new Date(lastSession.sessionDate);
      startDateForNewSessions.setDate(startDateForNewSessions.getDate() + 1);
    } else {
      startDateForNewSessions = new Date(program.startDate || Date.now());
    }

    let newDates: Date[] = [];
    if (params.extendDays && params.extendDays > 0) {
      newDates = this.generateSessionDates(
        startDateForNewSessions,
        new Date(startDateForNewSessions.getTime() + 365 * 86400000),
        {
          countLimit: params.extendDays,
          classDays: program.classDays,
          excludedDates: program.excludedDates,
          specialActiveDates: program.specialActiveDates,
          gapPeriods: program.gapPeriods,
        }
      );
    } else if (params.newEndDate) {
      const targetEnd = new Date(params.newEndDate);
      newDates = this.generateSessionDates(startDateForNewSessions, targetEnd, {
        classDays: program.classDays,
        excludedDates: program.excludedDates,
        specialActiveDates: program.specialActiveDates,
        gapPeriods: program.gapPeriods,
      });
    } else {
      newDates = this.generateSessionDates(
        startDateForNewSessions,
        new Date(startDateForNewSessions.getTime() + 30 * 86400000),
        {
          countLimit: 1,
          classDays: program.classDays,
          excludedDates: program.excludedDates,
          specialActiveDates: program.specialActiveDates,
          gapPeriods: program.gapPeriods,
        }
      );
    }

    const addedSessions: any[] = [];
    for (let i = 0; i < newDates.length; i++) {
      const sessionNum = currentSessionCount + i + 1;
      const date = newDates[i];
      const session = await TrainingSession.create({
        trainingProgramId: program._id,
        sessionNumber: sessionNum,
        title: `${program.title} - Day ${sessionNum} Session${params.remarks ? ` (${params.remarks})` : ' (Extended)'}`,
        sessionDate: date,
        startTime: '10:00 AM',
        endTime: `${10 + Math.floor(dailyHours)}:${dailyHours % 1 === 0.5 ? '30' : '00'} ${10 + Math.floor(dailyHours) >= 12 ? 'PM' : 'AM'}`,
        durationHours: dailyHours,
        trainer: program.trainerName,
        topicsCovered: params.remarks ? `Extended Duration Topic: ${params.remarks}` : `Curriculum extension Day ${sessionNum}`,
        isCompleted: false,
      });
      addedSessions.push(session);
    }

    // Update program end date and total hours
    if (newDates.length > 0) {
      const lastNewDate = newDates[newDates.length - 1];
      if (lastNewDate > program.endDate) {
        program.endDate = lastNewDate;
      }
      program.totalPlannedHours = (existingSessions.length + addedSessions.length) * dailyHours;
      if (program.status === 'Completed' || program.status === 'Scheduled') {
        program.status = 'Ongoing';
      }
      await program.save();
    }

    return {
      program,
      addedSessions,
      totalSessions: currentSessionCount + addedSessions.length,
    };
  }

  /**
   * Auto-generate sessions for existing programs that have 0 sessions configured
   */
  static async autoGenerateProgramSessions(programId: string, dailyHours: number = 2, forceRegenerate: boolean = false) {
    const program = await TrainingProgram.findById(programId);
    if (!program) throw new Error('Training program not found');

    const existingCount = await TrainingSession.countDocuments({ trainingProgramId: programId });
    if (existingCount > 0 && !forceRegenerate) {
      return { message: 'Sessions already exist for this program', count: existingCount };
    }

    if (forceRegenerate) {
      await TrainingSession.deleteMany({ trainingProgramId: programId, isCompleted: false });
    }

    const existingCompleted = await TrainingSession.find({ trainingProgramId: programId, isCompleted: true }).sort({ sessionNumber: 1 });
    const existingDates = new Set(existingCompleted.map((s) => new Date(s.sessionDate).toISOString().split('T')[0]));

    const dates = this.generateSessionDates(program.startDate, program.endDate, {
      classDays: program.classDays,
      excludedDates: program.excludedDates,
      specialActiveDates: program.specialActiveDates,
      gapPeriods: program.gapPeriods,
    }).filter((d) => !existingDates.has(d.toISOString().split('T')[0]));

    const sessionDocs = dates.map((date, idx) => ({
      trainingProgramId: program._id,
      sessionNumber: existingCompleted.length + idx + 1,
      title: `${program.title} - Day ${existingCompleted.length + idx + 1} Session`,
      sessionDate: date,
      startTime: '10:00 AM',
      endTime: `${10 + Math.floor(dailyHours)}:${dailyHours % 1 === 0.5 ? '30' : '00'} ${10 + Math.floor(dailyHours) >= 12 ? 'PM' : 'AM'}`,
      durationHours: dailyHours,
      trainer: program.trainerName,
      topicsCovered: `Curriculum Day ${existingCompleted.length + idx + 1} for ${program.title}`,
      isCompleted: false,
    }));

    const created = await TrainingSession.insertMany(sessionDocs);
    program.totalPlannedHours = (existingCompleted.length + created.length) * dailyHours;
    await program.save();

    return {
      success: true,
      generatedCount: created.length,
      sessions: created,
    };
  }

  /**
   * Quick Add Next Single Attendance Day
   */
  static async quickAddNextSession(programId: string, customDate?: string) {
    if (customDate) {
      const program = await TrainingProgram.findById(programId);
      if (!program) throw new Error('Training program not found');
      const existingSessions = await TrainingSession.find({ trainingProgramId: programId }).sort({ sessionNumber: 1 });
      const sessionNum = existingSessions.length + 1;
      const session = await TrainingSession.create({
        trainingProgramId: program._id,
        sessionNumber: sessionNum,
        title: `${program.title} - Day ${sessionNum} Session`,
        sessionDate: new Date(customDate),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        durationHours: 2,
        trainer: program.trainerName,
        topicsCovered: `Curriculum session Day ${sessionNum}`,
        isCompleted: false,
      });
      program.totalPlannedHours = (existingSessions.length + 1) * 2;
      await program.save();
      return { program, addedSessions: [session], totalSessions: sessionNum };
    }

    return this.extendProgramDuration(programId, {
      extendDays: 1,
      dailyHours: 2,
      remarks: 'Extra Attendance Day',
    });
  }

  static async updateSession(sessionId: string, data: any) {
    const session = await TrainingSession.findByIdAndUpdate(sessionId, data, { new: true });
    if (!session) throw new Error('Training session not found');
    return session;
  }

  static async deleteSession(sessionId: string) {
    const session = await TrainingSession.findById(sessionId);
    if (!session) throw new Error('Training session not found');

    const programId = session.trainingProgramId;
    await TrainingSession.findByIdAndDelete(sessionId);

    // Re-number remaining sessions and recompute hours
    const remaining = await TrainingSession.find({ trainingProgramId: programId }).sort({ sessionDate: 1, sessionNumber: 1 });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].sessionNumber !== i + 1) {
        remaining[i].sessionNumber = i + 1;
        await remaining[i].save();
      }
    }

    const program = await TrainingProgram.findById(programId);
    if (program) {
      const totalHours = remaining.reduce((acc, s) => acc + (s.durationHours || 2), 0);
      program.totalPlannedHours = totalHours;
      await program.save();
    }

    return { success: true, remainingCount: remaining.length };
  }

  static async deleteProgram(id: string) {
    const program = await TrainingProgram.findById(id);
    if (!program) {
      throw new Error('Training program not found');
    }

    const sessions = await TrainingSession.find({ trainingProgramId: id });
    const sessionIds = sessions.map((s) => s._id);

    if (sessionIds.length > 0) {
      await AttendanceRecord.deleteMany({ trainingSessionId: { $in: sessionIds } });
    }

    await TrainingSession.deleteMany({ trainingProgramId: id });
    await TrainingEnrollment.deleteMany({ trainingProgramId: id });
    await TrainingProgram.findByIdAndDelete(id);
    return program;
  }

  // Sessions
  static async createSession(data: any) {
    const count = await TrainingSession.countDocuments({ trainingProgramId: data.trainingProgramId });
    return TrainingSession.create({
      ...data,
      sessionNumber: count + 1,
    });
  }

  static async getSessionsByProgram(programId: string) {
    return TrainingSession.find({ trainingProgramId: programId }).sort({ sessionNumber: 1 });
  }

  // Training Assignment (Selective Students, Batch, Section, Department, Interdepartment)
  static async assignProgramToTargets(params: {
    programId: string;
    targetType: 'SECTION' | 'DEPARTMENT' | 'STUDENTS' | 'INTERDEPARTMENT' | 'BATCH';
    sectionId?: string;
    departmentId?: string;
    departmentIds?: string[];
    batchId?: string;
    batchIds?: string[];
    yearOfStudy?: number;
    studentIds?: string[];
  }) {
    const program = await TrainingProgram.findById(params.programId);
    if (!program) throw new Error('Training program not found');

    let eligibleStudents: any[] = [];

    if (params.targetType === 'BATCH') {
      const batchList =
        params.batchIds && params.batchIds.length > 0
          ? params.batchIds
          : params.batchId
          ? [params.batchId]
          : (program.targetBatchIds && program.targetBatchIds.length > 0)
          ? program.targetBatchIds.map((b: any) => (typeof b === 'string' ? b : b.toString()))
          : [];

      const query: any = { status: 'Active' };
      if (batchList.length > 0) {
        query.batchId = { $in: batchList };
      }
      if (params.departmentIds && params.departmentIds.length > 0) {
        query.departmentId = { $in: params.departmentIds };
      } else if (params.departmentId) {
        query.departmentId = params.departmentId;
      } else if (program.targetDepartmentIds && program.targetDepartmentIds.length > 0) {
        query.departmentId = { $in: program.targetDepartmentIds };
      }
      eligibleStudents = await Student.find(query);
    } else if (params.targetType === 'SECTION' && params.sectionId) {
      eligibleStudents = await Student.find({
        currentClassSectionId: params.sectionId,
        status: 'Active',
      });
    } else if (params.targetType === 'DEPARTMENT' && (params.departmentId || params.departmentIds)) {
      const depts =
        params.departmentIds && params.departmentIds.length > 0
          ? params.departmentIds
          : params.departmentId
          ? [params.departmentId]
          : [];
      const query: any = { departmentId: { $in: depts }, status: 'Active' };
      if (params.batchId) query.batchId = params.batchId;
      if (params.batchIds && params.batchIds.length > 0) query.batchId = { $in: params.batchIds };
      if (params.yearOfStudy) query.currentYearOfStudy = params.yearOfStudy;
      eligibleStudents = await Student.find(query);
    } else if (params.targetType === 'INTERDEPARTMENT') {
      const depts =
        params.departmentIds && params.departmentIds.length > 0
          ? params.departmentIds
          : program.targetDepartmentIds;
      const query: any = { departmentId: { $in: depts }, status: 'Active' };
      if (params.batchId) query.batchId = params.batchId;
      if (params.batchIds && params.batchIds.length > 0) query.batchId = { $in: params.batchIds };
      if (params.yearOfStudy) query.currentYearOfStudy = params.yearOfStudy;
      eligibleStudents = await Student.find(query);
    } else if (params.targetType === 'STUDENTS' && params.studentIds) {
      eligibleStudents = await Student.find({
        _id: { $in: params.studentIds },
        status: 'Active',
      });
    }

    let newlyEnrolled = 0;
    for (const student of eligibleStudents) {
      const exists = await TrainingEnrollment.findOne({
        trainingProgramId: program._id,
        studentId: student._id,
      });

      if (!exists) {
        // If a program is targeted for a future year (e.g. Year 4 / Final Year),
        // students assigned by their batch (who may currently be in Year 3) will be enrolled
        // under the program's intended year so it reflects in their final-year journey.
        const enrollmentYear =
          params.yearOfStudy ||
          (program.targetYears && program.targetYears.length > 0
            ? program.targetYears.includes(student.currentYearOfStudy)
              ? student.currentYearOfStudy
              : program.targetYears[0]
            : student.currentYearOfStudy);

        await TrainingEnrollment.create({
          trainingProgramId: program._id,
          studentId: student._id,
          academicYearId: program.academicYearId,
          yearOfStudy: enrollmentYear,
          status: ENROLLMENT_STATUS.ENROLLED,
          attendancePercentage: 0,
        });
        newlyEnrolled++;
      }
    }

    return {
      totalTargeted: eligibleStudents.length,
      newlyEnrolled,
      alreadyEnrolled: eligibleStudents.length - newlyEnrolled,
    };
  }

  // Get enrolled students for a program
  static async getEnrolledStudents(programId: string) {
    const enrollments = await TrainingEnrollment.find({ trainingProgramId: programId })
      .populate({
        path: 'studentId',
        populate: [
          { path: 'departmentId', select: 'code name' },
          { path: 'batchId', select: 'name startYear endYear' },
          { path: 'currentClassSectionId', select: 'section displayName' },
        ],
      })
      .sort({ createdAt: -1 });

    return enrollments.map((e: any) => ({
      enrollmentId: e._id,
      studentId: e.studentId?._id,
      name: e.studentId?.name || 'Unknown',
      registerNumber: e.studentId?.registerNumber || '',
      rollNumber: e.studentId?.rollNumber || '',
      department: e.studentId?.departmentId?.code || 'N/A',
      departmentName: e.studentId?.departmentId?.name || '',
      batch: e.studentId?.batchId?.name || 'N/A',
      section: e.studentId?.currentClassSectionId?.section || 'N/A',
      currentYearOfStudy: e.studentId?.currentYearOfStudy,
      yearOfStudy: e.yearOfStudy,
      status: e.status,
      attendancePercentage: e.attendancePercentage,
      assessmentAverage: e.assessmentAverage,
      enrolledAt: e.enrolledAt,
    }));
  }

  // Unenroll a student from a program
  static async unenrollStudent(programId: string, studentId: string) {
    const deleted = await TrainingEnrollment.findOneAndDelete({
      trainingProgramId: programId,
      studentId,
    });
    if (!deleted) throw new Error('Enrollment record not found');
    return deleted;
  }

  /**
   * REVERSE TRAINING QUERY:
   * "Who has NOT attended this training?"
   * Categorizes all enrolled students into:
   * - Assigned
   * - Attended (attendance rate >= threshold)
   * - Absent (attendance rate < threshold or marked absent)
   * - Pending (no sessions held yet)
   */
  static async getProgramParticipationStatus(programId: string, departmentId?: string) {
    const program = await TrainingProgram.findById(programId).populate('categoryId academicYearId');
    if (!program) throw new Error('Program not found');

    const [enrollments, sessions] = await Promise.all([
      TrainingEnrollment.find({ trainingProgramId: programId })
        .populate({
          path: 'studentId',
          populate: [
            { path: 'departmentId', select: 'code name' },
            { path: 'currentClassSectionId', select: 'displayName section' },
          ],
        }),
      TrainingSession.find({ trainingProgramId: programId }).sort({ sessionNumber: 1 }),
    ]);

    const threshold = program.minAttendanceThreshold || 75;
    const totalSessions = sessions.length;

    const assigned: any[] = [];
    const attended: any[] = [];
    const absent: any[] = [];
    const pending: any[] = [];

    for (const enr of enrollments) {
      const student = enr.studentId as any;
      if (!student) continue;

      // Scope to department if requested (e.g. HOD review)
      if (departmentId) {
        const sDeptId = student.departmentId?._id ? student.departmentId._id.toString() : student.departmentId?.toString();
        if (sDeptId !== departmentId.toString()) continue;
      }

      const studentData = {
        studentId: student._id,
        name: student.name,
        registerNumber: student.registerNumber,
        rollNumber: student.rollNumber,
        department: student.departmentId?.code || 'N/A',
        section: student.currentClassSectionId?.displayName || student.currentSection,
        email: student.email,
        phone: student.phone,
        attendancePercentage: enr.attendancePercentage,
        status: enr.status,
      };

      assigned.push(studentData);

      if (totalSessions === 0) {
        pending.push(studentData);
      } else if (enr.attendancePercentage >= threshold) {
        attended.push(studentData);
      } else {
        absent.push(studentData);
      }
    }

    return {
      program: {
        id: program._id,
        title: program.title,
        code: program.code,
        category: (program.categoryId as any)?.name || 'General',
        threshold,
        totalSessions,
      },
      metrics: {
        assignedCount: assigned.length,
        attendedCount: attended.length,
        absentCount: absent.length,
        pendingCount: pending.length,
      },
      cohorts: {
        assigned,
        attended,
        absent,
        pending,
      },
    };
  }

  /**
   * Bulk Import Training Programs from CSV/array data.
   * Auto-generates training sessions and planned hours for each imported program.
   */
  static async bulkImportPrograms(
    payload: {
      programs: any[];
      defaultParams?: {
        departmentId?: string;
        batchId?: string;
        targetYears?: number[];
        categoryId?: string;
        dailyHours?: number;
        minAttendanceThreshold?: number;
        includeSundays?: boolean;
      };
    },
    authUser?: any
  ) {
    const { programs = [], defaultParams = {} } = payload;

    if (!Array.isArray(programs) || programs.length === 0) {
      throw new Error('No programs data provided for bulk import');
    }

    // 1. Resolve Academic Year
    let academicYear = await AcademicYear.findOne({ isCurrent: true });
    if (!academicYear) {
      academicYear = await AcademicYear.findOne().sort({ order: -1 });
    }
    if (!academicYear) {
      throw new Error('No academic year found in system. Please configure an academic year first.');
    }

    // 2. Fetch categories, departments, and batches for lookup
    const [categories, departments, batches] = await Promise.all([
      TrainingCategory.find(),
      Department.find(),
      Batch.find(),
    ]);

    const defaultCategory = categories.find((c) => c._id.toString() === defaultParams.categoryId) || categories[0];
    if (!defaultCategory) {
      throw new Error('No training categories available. Please create at least one category first.');
    }

    // 3. Pre-check existing program codes
    const incomingCodes = new Set<string>();
    for (const item of programs) {
      const code = (item.code || item.programCode || '').trim().toUpperCase();
      if (code) incomingCodes.add(code);
    }

    const existingPrograms = await TrainingProgram.find({
      code: { $in: Array.from(incomingCodes) },
    }).select('code title');
    const existingCodeSet = new Set(existingPrograms.map((p) => p.code.toUpperCase()));

    const isHOD = authUser?.role === ROLES.HOD && authUser?.departmentId;
    const targetDeptId = isHOD
      ? authUser.departmentId.toString()
      : defaultParams.departmentId || (departments[0]?._id?.toString() ?? '');

    const createdPrograms: any[] = [];
    const skippedList: { code: string; title: string; reason: string }[] = [];
    const processedCodesInBatch = new Set<string>();

    for (let i = 0; i < programs.length; i++) {
      const row = programs[i];
      const title = (row.title || row.programName || row.name || '').trim();
      const rawCode = (row.code || row.programCode || '').trim().toUpperCase();
      const trainerName = (row.trainerName || row.trainer || '').trim();
      const rawStartDate = row.startDate;
      const rawEndDate = row.endDate;

      if (!title) {
        skippedList.push({
          code: rawCode || `Row #${i + 1}`,
          title: 'Unknown',
          reason: 'Program title is required',
        });
        continue;
      }

      if (!rawCode) {
        skippedList.push({
          code: `Row #${i + 1}`,
          title,
          reason: 'Program code is required',
        });
        continue;
      }

      if (existingCodeSet.has(rawCode)) {
        skippedList.push({
          code: rawCode,
          title,
          reason: 'Program code already exists in the system',
        });
        continue;
      }

      if (processedCodesInBatch.has(rawCode)) {
        skippedList.push({
          code: rawCode,
          title,
          reason: 'Duplicate program code within the import CSV',
        });
        continue;
      }

      if (!trainerName) {
        skippedList.push({
          code: rawCode,
          title,
          reason: 'Trainer name is required',
        });
        continue;
      }

      const startDate = new Date(rawStartDate);
      const endDate = new Date(rawEndDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        skippedList.push({
          code: rawCode,
          title,
          reason: 'Invalid start or end date format (expected YYYY-MM-DD)',
        });
        continue;
      }

      if (startDate > endDate) {
        skippedList.push({
          code: rawCode,
          title,
          reason: 'Start date cannot be after end date',
        });
        continue;
      }

      // Mark code as seen in this batch
      processedCodesInBatch.add(rawCode);

      // Resolve Category
      let categoryId = defaultCategory._id;
      const categoryQuery = (row.category || row.categoryCode || row.categoryName || '').trim().toLowerCase();
      if (categoryQuery) {
        const matched = categories.find(
          (c) => c.code.toLowerCase() === categoryQuery || c.name.toLowerCase() === categoryQuery
        );
        if (matched) categoryId = matched._id;
      }

      // Resolve Target Years
      let targetYears: number[] = defaultParams.targetYears && defaultParams.targetYears.length > 0
        ? defaultParams.targetYears
        : [4];

      const rawTargetYears = row.targetYears || row.year || row.targetYear;
      if (rawTargetYears !== undefined && rawTargetYears !== null && String(rawTargetYears).trim() !== '') {
        const parsedYears = String(rawTargetYears)
          .split(/[,;\s]+/)
          .map((y) => Number(y.trim()))
          .filter((y) => !isNaN(y) && y >= 1 && y <= 4);
        if (parsedYears.length > 0) {
          targetYears = Array.from(new Set(parsedYears));
        }
      }

      // Resolve Target Department
      let programDeptIds: Types.ObjectId[] = [];
      if (isHOD) {
        programDeptIds = [new Types.ObjectId(authUser.departmentId)];
      } else {
        const rowDeptCode = (row.department || row.departmentCode || '').trim().toUpperCase();
        if (rowDeptCode) {
          const matchedDept = departments.find((d) => d.code.toUpperCase() === rowDeptCode);
          if (matchedDept) {
            programDeptIds = [matchedDept._id as Types.ObjectId];
          }
        }
        if (programDeptIds.length === 0 && targetDeptId) {
          programDeptIds = [new Types.ObjectId(targetDeptId)];
        }
      }

      // Resolve Target Batch
      let programBatchIds: Types.ObjectId[] = [];
      const rowBatchName = (row.batch || row.batchName || '').trim();
      if (rowBatchName) {
        const matchedBatch = batches.find((b) => b.name.toLowerCase() === rowBatchName.toLowerCase());
        if (matchedBatch) {
          programBatchIds = [matchedBatch._id as Types.ObjectId];
        }
      }
      if (programBatchIds.length === 0 && defaultParams.batchId) {
        programBatchIds = [new Types.ObjectId(defaultParams.batchId)];
      }

      // Resolve Class Days (Sundays inclusion)
      const includeSundays =
        row.includeSundays === true ||
        String(row.includeSundays).toLowerCase() === 'true' ||
        String(row.includeSundays).toLowerCase() === 'yes' ||
        String(row.sundays).toLowerCase() === 'yes' ||
        defaultParams.includeSundays === true;

      const classDays = includeSundays ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];

      const dailyHours = Number(row.dailyHours || row.hoursPerDay || defaultParams.dailyHours || 2);
      const minAttendanceThreshold = Number(
        row.minAttendanceThreshold || row.threshold || defaultParams.minAttendanceThreshold || 75
      );

      // Create Program
      const newProgram = await TrainingProgram.create({
        title,
        code: rawCode,
        categoryId,
        academicYearId: academicYear._id,
        targetYears,
        targetBatchIds: programBatchIds,
        targetDepartmentIds: programDeptIds,
        targetSections: ['A'],
        trainerName,
        trainerEmail: row.trainerEmail?.trim() || undefined,
        trainerOrganization: row.trainerOrganization?.trim() || row.organization?.trim() || undefined,
        startDate,
        endDate,
        classDays,
        excludedDates: [],
        specialActiveDates: [],
        gapPeriods: [],
        dailyHours,
        status: 'Scheduled',
        minAttendanceThreshold,
        description: row.description?.trim() || undefined,
        totalPlannedHours: 0,
      });

      // Auto-generate training sessions
      const sessionDates = this.generateSessionDates(startDate, endDate, { classDays });
      const sessionDocs = sessionDates.map((date, idx) => ({
        trainingProgramId: newProgram._id,
        sessionNumber: idx + 1,
        title: `${newProgram.title} - Day ${idx + 1} Session`,
        sessionDate: date,
        startTime: '10:00 AM',
        endTime: `${10 + Math.floor(dailyHours)}:${dailyHours % 1 === 0.5 ? '30' : '00'} ${10 + Math.floor(dailyHours) >= 12 ? 'PM' : 'AM'}`,
        durationHours: dailyHours,
        trainer: newProgram.trainerName,
        topicsCovered: `Trainer curriculum Day ${idx + 1} for ${newProgram.title}`,
        isCompleted: false,
      }));

      if (sessionDocs.length > 0) {
        await TrainingSession.insertMany(sessionDocs);
        newProgram.totalPlannedHours = sessionDocs.length * dailyHours;
        await newProgram.save();
      }

      createdPrograms.push(newProgram);
    }

    return {
      success: true,
      importedCount: createdPrograms.length,
      skippedCount: skippedList.length,
      skippedList,
      programs: createdPrograms,
    };
  }
}

