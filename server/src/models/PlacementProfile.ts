import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkill {
  name: string;
  category: string; // 'Technical', 'Soft Skills', 'Tool', 'Framework'
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verified: boolean;
}

export interface IPlacementProfile extends Document {
  studentId: Types.ObjectId;
  cgpa: number;
  activeBacklogs: number;
  historyOfBacklogs: number;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  leetcodeUrl?: string;
  preferredRoles: string[];
  skills: ISkill[];
  certifications: Array<{
    title: string;
    issuer: string;
    issueDate?: Date;
    credentialUrl?: string;
  }>;
  readinessScore: number; // 0 - 100 calculated from attendance, assessment, skills, backlogs
  placementStatus: 'Not Placed' | 'Placed' | 'Opted Out' | 'Higher Studies';
  placedCompany?: string;
  packageLPA?: number;
}

const placementProfileSchema = new Schema<IPlacementProfile>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true, index: true },
    cgpa: { type: Number, default: 0, min: 0, max: 10 },
    activeBacklogs: { type: Number, default: 0 },
    historyOfBacklogs: { type: Number, default: 0 },
    resumeUrl: { type: String },
    githubUrl: { type: String },
    linkedinUrl: { type: String },
    portfolioUrl: { type: String },
    leetcodeUrl: { type: String },
    preferredRoles: [{ type: String }],
    skills: [
      {
        name: { type: String, required: true },
        category: { type: String, default: 'Technical' },
        proficiency: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
          default: 'Intermediate',
        },
        verified: { type: Boolean, default: false },
      },
    ],
    certifications: [
      {
        title: { type: String, required: true },
        issuer: { type: String, required: true },
        issueDate: { type: Date },
        credentialUrl: { type: String },
      },
    ],
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    placementStatus: {
      type: String,
      enum: ['Not Placed', 'Placed', 'Opted Out', 'Higher Studies'],
      default: 'Not Placed',
      index: true,
    },
    placedCompany: { type: String },
    packageLPA: { type: Number },
  },
  { timestamps: true }
);

export const PlacementProfile = mongoose.model<IPlacementProfile>(
  'PlacementProfile',
  placementProfileSchema
);
