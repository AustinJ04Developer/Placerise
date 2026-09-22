import { Types } from 'mongoose';
import { AttendanceRecord } from '../../models/AttendanceRecord.js';
import { TrainingSession } from '../../models/TrainingSession.js';
import { TrainingProgram } from '../../models/TrainingProgram.js';
import { TrainingEnrollment } from '../../models/TrainingEnrollment.js';
import { Student } from '../../models/Student.js';
import { AttendanceStatus } from '../../config/constants.js';

export class AttendanceService {
  /**
   * Get attendance roster for a session:
   * Returns all students enrolled in the parent program, along with any existing marked status
   */
  static async getSessionRoster(sessionId: string) {
    const session = await TrainingSession.findById(sessionId).populate('trainingProgramId');
    if (!session) throw new Error('Training session not found');

    const programId = session.trainingProgramId._id;
    const enrollments = await TrainingEnrollment.find({ trainingProgramId: programId })
      .populate({
        path: 'studentId',
        populate: [
          { path: 'departmentId', select: 'code name' },
          { path: 'currentClassSectionId', select: 'displayName section' },
        ],
      })
      .sort({ 'studentId.rollNumber': 1 });

    const existingRecords = await AttendanceRecord.find({ trainingSessionId: sessionId });
    const recordsMap = new Map<string, any>();
    existingRecords.forEach((rec) => {
      recordsMap.set(rec.studentId.toString(), rec);
    });

    const roster = enrollments.map((enr) => {
      const student = enr.studentId as any;
      if (!student) return null;

      const record = recordsMap.get(student._id.toString());
      return {
        studentId: student._id,
        registerNumber: student.registerNumber,
        rollNumber: student.rollNumber,
        name: student.name,
        section: student.currentClassSectionId?.displayName || student.currentSection,
        status: record ? record.status : 'Present', // default to Present for convenience
        remarks: record ? record.remarks : '',
        isMarked: !!record,
      };
    }).filter(Boolean);

    return {
      session,
      totalEnrolled: roster.length,
      markedCount: existingRecords.length,
      roster,
    };
  }

  /**
   * BULK ATTENDANCE SUBMISSION
   * Upserts attendance for multiple students, updates enrollment percentages and marks session completed.
   */
  static async markBulkAttendance(params: {
    sessionId: string;
    records: Array<{
      studentId: string;
      status: AttendanceStatus;
      remarks?: string;
    }>;
    userId: string;
  }) {
    const session = await TrainingSession.findById(params.sessionId);
    if (!session) throw new Error('Training session not found');

    const program = await TrainingProgram.findById(session.trainingProgramId);
    if (!program) throw new Error('Training program not found');

    const studentIds = params.records.map((r) => r.studentId);
    const students = await Student.find({ _id: { $in: studentIds } });
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    // Perform upserts for each record
    for (const item of params.records) {
      const student = studentMap.get(item.studentId);
      if (!student) continue;

      await AttendanceRecord.findOneAndUpdate(
        { trainingSessionId: session._id, studentId: student._id },
        {
          $set: {
            trainingProgramId: program._id,
            academicYearId: program.academicYearId,
            yearOfStudy: student.currentYearOfStudy,
            date: session.sessionDate,
            status: item.status,
            remarks: item.remarks || '',
            markedBy: params.userId,
          },
        },
        { upsert: true, new: true }
      );
    }

    session.isCompleted = true;
    await session.save();

    // Recompute attendance percentage for each student in this program
    const totalSessions = await TrainingSession.countDocuments({
      trainingProgramId: program._id,
      isCompleted: true,
    });

    for (const studentId of studentIds) {
      const attendedCount = await AttendanceRecord.countDocuments({
        trainingProgramId: program._id,
        studentId,
        status: { $in: ['Present', 'Late'] },
      });

      const percentage = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;
      const threshold = program.minAttendanceThreshold || 75;

      await TrainingEnrollment.findOneAndUpdate(
        { trainingProgramId: program._id, studentId },
        {
          $set: {
            attendancePercentage: percentage,
            hasGap: percentage < threshold,
            status: percentage >= threshold ? 'Completed' : 'Incomplete',
          },
        }
      );
    }

    return {
      success: true,
      processed: params.records.length,
      sessionId: session._id,
    };
  }
}
