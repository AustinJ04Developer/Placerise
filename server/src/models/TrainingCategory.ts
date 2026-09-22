import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainingCategory extends Document {
  name: string; // Aptitude, Coding, Soft Skills, Mock Interview, Domain, Full Stack, etc.
  code: string;
  color: string; // Tailwind or Hex color
  description?: string;
  isActive: boolean;
  order: number;
}

const trainingCategorySchema = new Schema<ITrainingCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    color: { type: String, default: '#0284c7' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TrainingCategory = mongoose.model<ITrainingCategory>('TrainingCategory', trainingCategorySchema);
