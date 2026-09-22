import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrainingSession extends Document {
  trainingProgramId: Types.ObjectId;
  sessionNumber: number;
  title: string;
  sessionDate: Date;
  startTime?: string; // e.g. "09:30"
  endTime?: string; // e.g. "12:30"
  durationHours: number;
  trainer: string;
  topicsCovered?: string;
  isCompleted: boolean;
}

const trainingSessionSchema = new Schema<ITrainingSession>(
  {
    trainingProgramId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    sessionDate: { type: Date, required: true, index: true },
    startTime: { type: String },
    endTime: { type: String },
    durationHours: { type: Number, required: true, default: 2 },
    trainer: { type: String, required: true },
    topicsCovered: { type: String },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

trainingSessionSchema.index({ trainingProgramId: 1, sessionNumber: 1 }, { unique: true });

export const TrainingSession = mongoose.model<ITrainingSession>('TrainingSession', trainingSessionSchema);
