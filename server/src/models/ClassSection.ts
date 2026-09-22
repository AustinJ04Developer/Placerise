import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClassSection extends Document {
  academicYearId: Types.ObjectId;
  departmentId: Types.ObjectId;
  batchId: Types.ObjectId;
  yearOfStudy: number; // 1, 2, 3, 4
  section: string; // "A", "B", "C"
  facultyInchargeId?: Types.ObjectId;
  displayName: string; // e.g. "IV CSE A"
}

const classSectionSchema = new Schema<IClassSection>(
  {
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    yearOfStudy: { type: Number, required: true, min: 1, max: 4, index: true },
    section: { type: String, required: true, uppercase: true, trim: true },
    facultyInchargeId: { type: Schema.Types.ObjectId, ref: 'User' },
    displayName: { type: String, required: true },
  },
  { timestamps: true }
);

classSectionSchema.index(
  { academicYearId: 1, departmentId: 1, yearOfStudy: 1, section: 1 },
  { unique: true }
);

export const ClassSection = mongoose.model<IClassSection>('ClassSection', classSectionSchema);
