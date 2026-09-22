import mongoose, { Document, Schema, Types } from 'mongoose';
import { ROLES, UserRole } from '../config/constants.js';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  officeCabin?: string;
  bio?: string;
  studentId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  assignedSectionId?: Types.ObjectId; // For Class Incharge
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      index: true,
    },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    officeCabin: { type: String, trim: true },
    bio: { type: String, trim: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    assignedSectionId: { type: Schema.Types.ObjectId, ref: 'ClassSection' },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
