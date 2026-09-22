import { Request, Response } from 'express';
import { ApprovalsService } from './approvals.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class ApprovalsController {
  static async createRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const item = await ApprovalsService.createRequest({
        ...req.body,
        requesterId: req.user!._id.toString(),
      });

      await recordAuditLog(req, {
        action: 'SUBMIT_APPROVAL_REQUEST',
        entity: 'ApprovalRequest',
        entityId: item._id,
        newValue: item,
        details: `Submitted ${item.requestType} for approval`,
      });

      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getRequests(req: Request, res: Response): Promise<void> {
    const authUser = (req as AuthRequest).user;
    const requests = await ApprovalsService.getRequests(
      { status: req.query.status as string },
      authUser
    );
    res.json({ success: true, data: requests });
  }

  static async reviewRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, comment } = req.body;

      if (!['Approved', 'Rejected'].includes(action)) {
        res.status(400).json({ success: false, message: 'Action must be Approved or Rejected' });
        return;
      }

      const updated = await ApprovalsService.reviewRequest({
        requestId: id,
        reviewerId: req.user!._id.toString(),
        reviewerRole: req.user?.role,
        reviewerDeptId: req.user?.departmentId?.toString(),
        action,
        comment,
      });

      await recordAuditLog(req, {
        action: `${action.toUpperCase()}_APPROVAL_REQUEST`,
        entity: 'ApprovalRequest',
        entityId: id,
        details: `${action} approval request: ${id}. Comment: ${comment || 'N/A'}`,
      });

      res.json({ success: true, message: `Request successfully ${action.toLowerCase()}`, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
