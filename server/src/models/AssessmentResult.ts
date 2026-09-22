import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssessmentResult extends Document {
  assessmentId: Types.ObjectId;
  trainingProgramId: Types.ObjectId;
  studentId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  yearOfStudy: number;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string; // "A+", "A", "B", "C", "F"
  status: 'Passed' | 'Failed' | 'Absent';
  remarks?: string;
  evaluatedBy: Types.ObjectId;
  evaluatedAt: Date;
}

const assessmentResultSchema = new Schema<IAssessmentResult>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    trainingProgramId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    yearOfStudy: { type: Number, required: true, min: 1, max: 4, index: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, default: 100 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, default: 'B' },
    status: { type: String, enum: ['Passed', 'Failed', 'Absent'], required: true, index: true },
    remarks: { type: String, trim: true },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assessmentResultSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
assessmentResultSchema.index({ studentId: 1, trainingProgramId: 1 });

export const AssessmentResult = mongoose.model<IAssessmentResult>(
  'AssessmentResult',
  assessmentResultSchema
);
