import mongoose, { Document, Schema, Types } from 'mongoose';
import { ENROLLMENT_STATUS, EnrollmentStatus } from '../config/constants.js';

export interface ITrainingEnrollment extends Document {
  trainingProgramId: Types.ObjectId;
  studentId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  yearOfStudy: number; // Year 1, 2, 3, or 4 when enrolled
  enrolledAt: Date;
  status: EnrollmentStatus;
  attendancePercentage: number;
  assessmentAverage: number;
  hasGap: boolean;
  remarks?: string;
}

const trainingEnrollmentSchema = new Schema<ITrainingEnrollment>(
  {
    trainingProgramId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    yearOfStudy: { type: Number, required: true, min: 1, max: 4, index: true },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ENROLLED,
      index: true,
    },
    attendancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    assessmentAverage: { type: Number, default: 0, min: 0, max: 100 },
    hasGap: { type: Boolean, default: false, index: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

trainingEnrollmentSchema.index({ trainingProgramId: 1, studentId: 1 }, { unique: true });

export const TrainingEnrollment = mongoose.model<ITrainingEnrollment>(
  'TrainingEnrollment',
  trainingEnrollmentSchema
);
