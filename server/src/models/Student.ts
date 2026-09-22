import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudent extends Document {
  registerNumber: string; // Unique permanent ID, e.g. "23CS001"
  rollNumber: string; // e.g. "01"
  name: string;
  email: string;
  phone?: string;
  gender: 'Male' | 'Female' | 'Other';
  departmentId: Types.ObjectId;
  batchId: Types.ObjectId;
  currentClassSectionId: Types.ObjectId;
  currentYearOfStudy: number; // 1, 2, 3, 4
  currentSection: string; // "A", "B"
  githubUrl?: string;
  linkedinUrl?: string;
  leetcodeUrl?: string;
  status: 'Active' | 'Graduated' | 'Discontinued';
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    registerNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    rollNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    currentClassSectionId: { type: Schema.Types.ObjectId, ref: 'ClassSection', required: true, index: true },
    currentYearOfStudy: { type: Number, required: true, min: 1, max: 4, index: true },
    currentSection: { type: String, required: true, uppercase: true },
    githubUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    leetcodeUrl: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Graduated', 'Discontinued'], default: 'Active', index: true },
  },
  { timestamps: true }
);

studentSchema.index({ currentClassSectionId: 1, rollNumber: 1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
