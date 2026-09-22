import { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class AdminController {
  static async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await AdminService.getSettings();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await AdminService.updateSettings(req.body, req.user?.id);
      await recordAuditLog(req, {
        action: 'UPDATE_SYSTEM_SETTINGS',
        entity: 'SystemSetting',
        entityId: 'INSTITUTION_SETTINGS',
        details: 'Updated institutional profile and placement benchmarks',
      });
      res.json({ success: true, message: 'Settings updated successfully', data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateKeys(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await AdminService.updateKeys(req.body, req.user?.id);
      await recordAuditLog(req, {
        action: 'UPDATE_AUTH_KEYS',
        entity: 'SystemSetting',
        entityId: 'AUTH_KEYS',
        details: 'Updated institutional role authorization keys',
      });
      res.json({ success: true, message: 'Authorization keys updated successfully', data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async rotateKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role } = req.body;
      if (!role) {
        res.status(400).json({ success: false, message: 'Role is required for key rotation' });
        return;
      }
      const result = await AdminService.rotateKey(role, req.user?.id);
      await recordAuditLog(req, {
        action: 'ROTATE_AUTH_KEY',
        entity: 'SystemSetting',
        entityId: role,
        details: `Rotated authorization key for role: ${role}`,
      });
      res.json({ success: true, message: `Key for ${role} rotated successfully`, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, search } = req.query;
      const data = await AdminService.getUsers({
        role: role as string,
        search: search as string,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await AdminService.updateUserStatus(id, req.body);
      await recordAuditLog(req, {
        action: 'UPDATE_USER_STATUS',
        entity: 'User',
        entityId: id,
        details: `Updated status/role for user ${data.name} (${data.email})`,
      });
      res.json({ success: true, message: 'User status updated successfully', data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSystemStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await AdminService.getSystemStats();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
