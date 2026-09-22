import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
          errors: [],
        });
        return;
      }

      const result = await AuthService.login(email, password);

      (req as any).user = result.user;
      await recordAuditLog(req, {
        action: 'LOGIN',
        entity: 'User',
        entityId: result.user.id,
        details: `User ${result.user.email} logged in successfully`,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
        errors: [],
      });
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);

      (req as any).user = result.user;
      await recordAuditLog(req, {
        action: 'REGISTER',
        entity: 'User',
        entityId: result.user.id,
        details: `User ${result.user.email} (${result.user.role}) registered successfully`,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        errors: [],
      });
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          errors: [],
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Refresh failed',
        errors: [],
      });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated', errors: [] });
      return;
    }

    const populatedUser = await req.user.populate([
      { path: 'studentId' },
      { path: 'departmentId' },
      { path: 'assignedSectionId' },
    ]);

    res.status(200).json({
      success: true,
      data: {
        id: populatedUser._id,
        email: populatedUser.email,
        name: populatedUser.name,
        role: populatedUser.role,
        phone: populatedUser.phone,
        designation: populatedUser.designation,
        officeCabin: populatedUser.officeCabin,
        bio: populatedUser.bio,
        studentId: populatedUser.studentId,
        departmentId: populatedUser.departmentId,
        assignedSectionId: populatedUser.assignedSectionId,
        permissions: populatedUser.permissions,
        lastLoginAt: populatedUser.lastLoginAt,
        createdAt: populatedUser.createdAt,
      },
    });
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }

      const { name, phone, designation, officeCabin, bio } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user._id.toString(), {
        name,
        phone,
        designation,
        officeCabin,
        bio,
      });

      await recordAuditLog(req, {
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: req.user._id,
        details: `User ${req.user.email} updated self profile details`,
        newValue: { name, phone, designation, officeCabin, bio },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Both current password and new password are required',
        });
        return;
      }

      const result = await AuthService.changePassword(
        req.user._id.toString(),
        currentPassword,
        newPassword
      );

      await recordAuditLog(req, {
        action: 'CHANGE_PASSWORD',
        entity: 'User',
        entityId: req.user._id,
        details: `User ${req.user.email} changed their password`,
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    if (req.user) {
      await AuthService.logout(req.user._id.toString());
      await recordAuditLog(req, {
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user._id,
        details: `User ${req.user.email} logged out`,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
