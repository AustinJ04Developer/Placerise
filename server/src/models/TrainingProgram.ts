import mongoose, { Document, Schema, Types } from 'mongoose';
import { PROGRAM_STATUS, ProgramStatus } from '../config/constants.js';

export interface ITrainingResource {
  title: string;
  fileUrl: string;
  type: 'pdf' | 'link' | 'video' | 'doc';
  sizeBytes?: number;
  uploadedAt: Date;
}

export interface ITrainingProgram extends Document {
  title: string; // e.g. "Java Full Stack Development"
  code: string; // e.g. "TR-2026-CSE-JAVA"
  categoryId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  targetYears: number[]; // e.g. [4] or [3, 4]
  targetBatchIds?: Types.ObjectId[]; // e.g. references to Batch (e.g. 2023-2027)
  targetDepartmentIds: Types.ObjectId[];
  targetSections: string[]; // ["A", "B"]
  trainerName: string;
  trainerEmail?: string;
  trainerOrganization?: string;
  startDate: Date;
  endDate: Date;
  classDays?: number[]; // [1, 2, 3, 4, 5, 6] (0=Sunday ... 6=Saturday)
  excludedDates?: Date[]; // Specific single dates with no classes
  specialActiveDates?: Date[]; // Specific dates (e.g. Sunday classes or makeup days) that HAVE classes even if off-schedule
  gapPeriods?: {
    startDate: Date;
    endDate: Date;
    reason?: string;
  }[]; // Gaps (weeks, months) without classes
  totalPlannedHours: number;
  status: ProgramStatus;
  minAttendanceThreshold: number; // percentage, e.g. 75
  description?: string;
  resources: ITrainingResource[];
  createdAt: Date;
  updatedAt: Date;
}

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    title: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'TrainingCategory', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    targetYears: [{ type: Number, required: true }],
    targetBatchIds: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
    targetDepartmentIds: [{ type: Schema.Types.ObjectId, ref: 'Department', required: true }],
    targetSections: [{ type: String, uppercase: true }],
    trainerName: { type: String, required: true, trim: true },
    trainerEmail: { type: String, lowercase: true, trim: true },
    trainerOrganization: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    classDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
    excludedDates: { type: [Date], default: [] },
    specialActiveDates: { type: [Date], default: [] },
    gapPeriods: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String },
      },
    ],
    totalPlannedHours: { type: Number, default: 40 },
    status: {
      type: String,
      enum: Object.values(PROGRAM_STATUS),
      default: PROGRAM_STATUS.SCHEDULED,
      index: true,
    },
    minAttendanceThreshold: { type: Number, default: 75, min: 0, max: 100 },
    description: { type: String },
    resources: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'link', 'video', 'doc'], default: 'pdf' },
        sizeBytes: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const TrainingProgram = mongoose.model<ITrainingProgram>('TrainingProgram', trainingProgramSchema);
