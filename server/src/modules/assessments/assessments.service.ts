import { Assessment } from '../../models/Assessment.js';
import { AssessmentResult } from '../../models/AssessmentResult.js';
import { TrainingProgram } from '../../models/TrainingProgram.js';
import { TrainingEnrollment } from '../../models/TrainingEnrollment.js';
import { Student } from '../../models/Student.js';

export class AssessmentsService {
  static async createAssessment(data: any, createdBy: string) {
    return Assessment.create({
      ...data,
      createdBy,
    });
  }

  static async getAssessmentsByProgram(programId: string) {
    return Assessment.find({ trainingProgramId: programId }).sort({ date: -1 });
  }

  static async getAssessmentRoster(assessmentId: string) {
    const assessment = await Assessment.findById(assessmentId).populate('trainingProgramId');
    if (!assessment) throw new Error('Assessment not found');

    const enrollments = await TrainingEnrollment.find({
      trainingProgramId: assessment.trainingProgramId._id,
    })
      .populate({
        path: 'studentId',
        populate: [{ path: 'currentClassSectionId' }, { path: 'departmentId' }],
      })
      .sort({ 'studentId.rollNumber': 1 });

    const existingResults = await AssessmentResult.find({ assessmentId });
    const resultsMap = new Map<string, any>();
    existingResults.forEach((res) => {
      resultsMap.set(res.studentId.toString(), res);
    });

    const roster = enrollments.map((enr) => {
      const student = enr.studentId as any;
      if (!student) return null;

      const existing = resultsMap.get(student._id.toString());
      return {
        studentId: student._id,
        registerNumber: student.registerNumber,
        rollNumber: student.rollNumber,
        name: student.name,
        section: student.currentClassSectionId?.displayName || student.currentSection,
        marksObtained: existing ? existing.marksObtained : 0,
        grade: existing ? existing.grade : '-',
        status: existing ? existing.status : 'Absent',
        remarks: existing ? existing.remarks : '',
        isGraded: !!existing,
      };
    }).filter(Boolean);

    return {
      assessment,
      roster,
    };
  }

  static async submitBulkResults(params: {
    assessmentId: string;
    results: Array<{
      studentId: string;
      marksObtained: number;
      remarks?: string;
    }>;
    evaluatedBy: string;
  }) {
    const assessment = await Assessment.findById(params.assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const program = await TrainingProgram.findById(assessment.trainingProgramId);
    if (!program) throw new Error('Training program not found');

    const studentIds = params.results.map((r) => r.studentId);
    const students = await Student.find({ _id: { $in: studentIds } });
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    for (const item of params.results) {
      const student = studentMap.get(item.studentId);
      if (!student) continue;

      const percentage = Math.round((item.marksObtained / assessment.maxMarks) * 100);
      let grade = 'F';
      let status: 'Passed' | 'Failed' | 'Absent' = 'Failed';

      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';

      if (item.marksObtained >= assessment.passingMarks) {
        status = 'Passed';
      }

      await AssessmentResult.findOneAndUpdate(
        { assessmentId: assessment._id, studentId: student._id },
        {
          $set: {
            trainingProgramId: program._id,
            academicYearId: program.academicYearId,
            yearOfStudy: student.currentYearOfStudy,
            marksObtained: item.marksObtained,
            maxMarks: assessment.maxMarks,
            percentage,
            grade,
            status,
            remarks: item.remarks || '',
            evaluatedBy: params.evaluatedBy,
            evaluatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    assessment.isCompleted = true;
    await assessment.save();

    // Recompute assessment average for enrolled students in this program
    for (const studentId of studentIds) {
      const studentResults = await AssessmentResult.find({
        trainingProgramId: program._id,
        studentId,
      });

      if (studentResults.length > 0) {
        const avg = Math.round(
          studentResults.reduce((acc, curr) => acc + curr.percentage, 0) / studentResults.length
        );
        await TrainingEnrollment.findOneAndUpdate(
          { trainingProgramId: program._id, studentId },
          { $set: { assessmentAverage: avg } }
        );
      }
    }

    return {
      success: true,
      processed: params.results.length,
      assessmentId: assessment._id,
    };
  }
}
