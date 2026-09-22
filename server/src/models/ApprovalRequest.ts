import mongoose, { Document, Schema, Types } from 'mongoose';
import { APPROVAL_STATUS, ApprovalStatus } from '../config/constants.js';

export interface IApprovalRequest extends Document {
  requestType: 'ATTENDANCE_CORRECTION' | 'ASSESSMENT_UPDATE' | 'STUDENT_SECTION_CHANGE' | 'PROFILE_OVERRIDE';
  requesterId: Types.ObjectId;
  entityType: string;
  entityId: Types.ObjectId;
  previousValue: any;
  proposedValue: any;
  reason: string;
  status: ApprovalStatus;
  reviewedBy?: Types.ObjectId;
  reviewComment?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const approvalRequestSchema = new Schema<IApprovalRequest>(
  {
    requestType: { type: String, required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    previousValue: { type: Schema.Types.Mixed },
    proposedValue: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewComment: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const ApprovalRequest = mongoose.model<IApprovalRequest>(
  'ApprovalRequest',
  approvalRequestSchema
);
