import mongoose, { Document, Schema, Types } from 'mongoose';
import { ASSESSMENT_TYPE, AssessmentType } from '../config/constants.js';

export interface IAssessment extends Document {
  trainingProgramId: Types.ObjectId;
  title: string;
  type: AssessmentType;
  maxMarks: number;
  passingMarks: number;
  date: Date;
  durationMinutes?: number;
  weightagePercent?: number;
  description?: string;
  isCompleted: boolean;
  createdBy: Types.ObjectId;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    trainingProgramId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(ASSESSMENT_TYPE),
      default: ASSESSMENT_TYPE.QUIZ,
    },
    maxMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 50 },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    weightagePercent: { type: Number, default: 100 },
    description: { type: String },
    isCompleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', assessmentSchema);
