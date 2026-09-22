import mongoose, { Document, Schema, Types } from 'mongoose';
import { ATTENDANCE_STATUS, AttendanceStatus } from '../config/constants.js';

export interface IAttendanceRecord extends Document {
  trainingSessionId: Types.ObjectId;
  trainingProgramId: Types.ObjectId;
  studentId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  yearOfStudy: number;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    trainingSessionId: { type: Schema.Types.ObjectId, ref: 'TrainingSession', required: true, index: true },
    trainingProgramId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    yearOfStudy: { type: Number, required: true, min: 1, max: 4, index: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: true,
      default: ATTENDANCE_STATUS.PRESENT,
      index: true,
    },
    remarks: { type: String, trim: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for the exact same session & student
attendanceRecordSchema.index({ trainingSessionId: 1, studentId: 1 }, { unique: true });
attendanceRecordSchema.index({ studentId: 1, trainingProgramId: 1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
