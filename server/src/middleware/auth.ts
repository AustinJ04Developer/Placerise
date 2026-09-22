import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { UserRole, ROLES } from '../config/constants.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token is missing or invalid',
        errors: [],
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'placerise_jwt_secret_key_change_in_production_2026';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account not found or deactivated',
        errors: [],
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      errors: [],
    });
  }
};

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated', errors: [] });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`,
        errors: [],
      });
      return;
    }

    next();
  };
};

/**
 * Scoped data ownership check:
 * - Placement Officer: Can access everything
 * - Student: Can only access their own student data
 * - Class Incharge: Can only access their assigned section
 */
export const enforceStudentAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated', errors: [] });
    return;
  }

  // Placement Officer, HOD, and Faculty have institutional access
  if (
    req.user.role === ROLES.PLACEMENT_OFFICER ||
    req.user.role === ROLES.HOD ||
    req.user.role === ROLES.FACULTY ||
    req.user.role === ROLES.CLASS_INCHARGE
  ) {
    return next();
  }

  // Student can only access their own studentId or their own profile
  let targetStudentId = req.params.studentId || req.params.id;
  if (req.user.role === ROLES.STUDENT) {
    if (targetStudentId === 'me') {
      if (!req.user.studentId) {
        res.status(404).json({
          success: false,
          message: 'No student record linked to this account',
          errors: [],
        });
        return;
      }
      targetStudentId = req.user.studentId.toString();
      if (req.params.id) req.params.id = targetStudentId;
      if (req.params.studentId) req.params.studentId = targetStudentId;
    }

    if (!req.user.studentId || req.user.studentId.toString() !== targetStudentId) {
      res.status(403).json({
        success: false,
        message: 'Students are only permitted to view their own training records and profile',
        errors: [],
      });
      return;
    }
  }

  next();
};
