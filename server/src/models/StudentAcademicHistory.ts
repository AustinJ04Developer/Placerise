import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudentAcademicHistory extends Document {
  studentId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  batchId: Types.ObjectId;
  departmentId: Types.ObjectId;
  yearOfStudy: number; // 1, 2, 3, 4
  section: string; // "A", "B"
  rollNumber: string;
  classSectionId: Types.ObjectId;
  status: 'Promoted' | 'Completed' | 'Current' | 'Detained';
  gpa?: number;
  remarks?: string;
}

const studentAcademicHistorySchema = new Schema<IStudentAcademicHistory>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    yearOfStudy: { type: Number, required: true, min: 1, max: 4, index: true },
    section: { type: String, required: true, uppercase: true },
    rollNumber: { type: String, required: true },
    classSectionId: { type: Schema.Types.ObjectId, ref: 'ClassSection', required: true },
    status: {
      type: String,
      enum: ['Promoted', 'Completed', 'Current', 'Detained'],
      default: 'Completed',
    },
    gpa: { type: Number },
    remarks: { type: String },
  },
  { timestamps: true }
);

studentAcademicHistorySchema.index(
  { studentId: 1, academicYearId: 1, yearOfStudy: 1 },
  { unique: true }
);

export const StudentAcademicHistory = mongoose.model<IStudentAcademicHistory>(
  'StudentAcademicHistory',
  studentAcademicHistorySchema
);
