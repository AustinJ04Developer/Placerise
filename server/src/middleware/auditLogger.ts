import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from './auth.js';

export interface LogAuditOptions {
  action: string;
  entity: string;
  entityId?: any;
  details?: string;
  previousValue?: any;
  newValue?: any;
}

export const recordAuditLog = async (
  req: AuthRequest | Request,
  options: LogAuditOptions
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) return;

    await AuditLog.create({
      userId: user._id || user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      details: options.details,
      previousValue: options.previousValue,
      newValue: options.newValue,
      ipAddress: req?.ip || req?.socket?.remoteAddress || '',
      userAgent: (req?.headers && req.headers['user-agent']) || (typeof (req as any)?.get === 'function' ? (req as any).get('user-agent') : '') || '',
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error);
  }
};
