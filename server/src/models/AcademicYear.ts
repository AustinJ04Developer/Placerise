import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicYear extends Document {
  name: string; // e.g., "2023-24", "2024-25", "2025-26", "2026-27"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  order: number;
}

const academicYearSchema = new Schema<IAcademicYear>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
    order: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

export const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', academicYearSchema);
