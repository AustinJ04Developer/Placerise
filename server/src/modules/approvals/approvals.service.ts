import { ApprovalRequest } from '../../models/ApprovalRequest.js';
import { APPROVAL_STATUS } from '../../config/constants.js';
import { AttendanceRecord } from '../../models/AttendanceRecord.js';
import { AssessmentResult } from '../../models/AssessmentResult.js';

export class ApprovalsService {
  static async createRequest(data: {
    requestType: 'ATTENDANCE_CORRECTION' | 'ASSESSMENT_UPDATE' | 'STUDENT_SECTION_CHANGE' | 'PROFILE_OVERRIDE';
    requesterId: string;
    entityType: string;
    entityId: string;
    previousValue: any;
    proposedValue: any;
    reason: string;
  }) {
    return ApprovalRequest.create({
      ...data,
      status: APPROVAL_STATUS.PENDING,
    });
  }

  static async getRequests(filter?: { status?: string }, user?: any) {
    const query: any = {};
    if (filter?.status) query.status = filter.status;

    // HOD is strictly scoped to approval requests originating in their department
    if (user?.role === 'hod' && user.departmentId) {
      const { User } = await import('../../models/User.js');
      const deptUsers = await User.find({ departmentId: user.departmentId }).select('_id');
      const deptUserIds = deptUsers.map((u) => u._id);
      query.requesterId = { $in: deptUserIds };
    }

    return ApprovalRequest.find(query)
      .populate('requesterId', 'name email role departmentId')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  static async reviewRequest(params: {
    requestId: string;
    reviewerId: string;
    reviewerRole?: string;
    reviewerDeptId?: string;
    action: 'Approved' | 'Rejected';
    comment?: string;
  }) {
    const req = await ApprovalRequest.findById(params.requestId);
    if (!req) throw new Error('Approval request not found');

    if (req.requesterId.toString() === params.reviewerId.toString()) {
      throw new Error('Self-approval is strictly prohibited. A different authorized official must review this request.');
    }

    // HOD can only review requests from their own department
    if (params.reviewerRole === 'hod' && params.reviewerDeptId) {
      const { User } = await import('../../models/User.js');
      const requester = await User.findById(req.requesterId);
      if (
        requester &&
        requester.departmentId &&
        requester.departmentId.toString() !== params.reviewerDeptId.toString()
      ) {
        throw new Error('Access Denied: HOD can only review requests originating in their department');
      }
    }

    if (req.status !== APPROVAL_STATUS.PENDING) {
      throw new Error('Request has already been processed');
    }

    const updatedReq = await ApprovalRequest.findOneAndUpdate(
      { _id: params.requestId, status: APPROVAL_STATUS.PENDING },
      {
        $set: {
          status: params.action,
          reviewedBy: params.reviewerId,
          reviewComment: params.comment,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedReq) {
      throw new Error('Request has already been processed by another reviewer');
    }

    // If approved, apply change to the target entity
    if (params.action === 'Approved') {
      if (updatedReq.entityType === 'AttendanceRecord') {
        await AttendanceRecord.findByIdAndUpdate(updatedReq.entityId, {
          status: updatedReq.proposedValue.status,
          remarks: updatedReq.proposedValue.remarks,
        });
      } else if (updatedReq.entityType === 'AssessmentResult') {
        await AssessmentResult.findByIdAndUpdate(updatedReq.entityId, {
          marksObtained: updatedReq.proposedValue.marksObtained,
          percentage: updatedReq.proposedValue.percentage,
          grade: updatedReq.proposedValue.grade,
        });
      }
    }

    return updatedReq;
  }
}
