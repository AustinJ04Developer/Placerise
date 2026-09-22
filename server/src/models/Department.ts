import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  code: string; // e.g. "CSE", "ECE", "EEE", "MECH", "CIVIL"
  name: string; // e.g. "Computer Science & Engineering"
  isActive: boolean;
}

const departmentSchema = new Schema<IDepartment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
