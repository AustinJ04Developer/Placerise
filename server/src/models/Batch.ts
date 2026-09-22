import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  name: string; // e.g. "2023-2027"
  startYear: number;
  endYear: number;
  isActive: boolean;
}

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
