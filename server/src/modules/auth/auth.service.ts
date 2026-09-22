import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User.js';
import { SystemSetting } from '../../models/SystemSetting.js';
import { ROLES, UserRole } from '../../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'placerise_jwt_secret_key_change_in_production_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'placerise_jwt_refresh_secret_key_change_in_production_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  static generateTokens(user: IUser) {
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
    );

    return { accessToken, refreshToken };
  }

  static async login(email: string, passwordPlain: string) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('studentId')
      .populate('departmentId')
      .populate('assignedSectionId');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('This account has been deactivated. Please contact the administrator.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        departmentId: user.departmentId,
        assignedSectionId: user.assignedSectionId,
        permissions: user.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(oldRefreshToken: string) {
    try {
      const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId)
        .populate('studentId')
        .populate('departmentId')
        .populate('assignedSectionId');

      if (!user || user.refreshToken !== oldRefreshToken || !user.isActive) {
        throw new Error('Invalid or expired refresh token');
      }

      const { accessToken, refreshToken } = this.generateTokens(user);
      user.refreshToken = refreshToken;
      await user.save();

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          departmentId: user.departmentId,
          assignedSectionId: user.assignedSectionId,
          permissions: user.permissions,
        },
        accessToken,
        refreshToken,
      };
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    staffAccessKey?: string;
    departmentId?: string;
    registerNumber?: string;
    rollNumber?: string;
    yearOfStudy?: number;
    section?: string;
  }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const role = data.role || 'student';

    // Security verification: elevated staff and administration roles require official role-specific authorization key
    if (role !== ROLES.STUDENT) {
      const settingKeyMap: Record<string, string> = {
        [ROLES.PLACEMENT_OFFICER]: 'AUTH_KEY_PLACEMENT_OFFICER',
        [ROLES.HOD]: 'AUTH_KEY_HOD',
        [ROLES.CLASS_INCHARGE]: 'AUTH_KEY_CLASS_INCHARGE',
        [ROLES.FACULTY]: 'AUTH_KEY_FACULTY',
      };
      const envKeyMap: Record<string, string> = {
        [ROLES.PLACEMENT_OFFICER]: process.env.AUTH_KEY_PLACEMENT_OFFICER || 'OFFICER@PLACERISE2026',
        [ROLES.HOD]: process.env.AUTH_KEY_HOD || 'HOD@PLACERISE2026',
        [ROLES.CLASS_INCHARGE]: process.env.AUTH_KEY_CLASS_INCHARGE || 'INCHARGE@PLACERISE2026',
        [ROLES.FACULTY]: process.env.AUTH_KEY_FACULTY || 'FACULTY@PLACERISE2026',
      };

      const settingRecord = await SystemSetting.findOne({ key: settingKeyMap[role] });
      const requiredKey = settingRecord?.value || envKeyMap[role];

      if (!requiredKey || !data.staffAccessKey || data.staffAccessKey.trim() !== requiredKey) {
        const roleLabel =
          role === ROLES.PLACEMENT_OFFICER
            ? 'Placement Officer'
            : role === ROLES.HOD
            ? 'Head of Department (HOD)'
            : role === ROLES.CLASS_INCHARGE
            ? 'Class Incharge'
            : 'Faculty Trainer';
        throw new Error(
          `Access Denied: Invalid authorization key for ${roleLabel}. Each administrative role requires its unique institutional security key.`
        );
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    let studentId: any = undefined;
    // Placement Officer has campus-wide institutional scope; no specific department
    let deptId: any = role === ROLES.PLACEMENT_OFFICER ? undefined : data.departmentId;

    if (role === 'student') {
      throw new Error(
        'Student accounts and self-registration are disabled. Placerise is strictly an administrative tracking portal. Student trainee records are managed directly by departmental staff.'
      );
    }

    const newUser = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role,
      departmentId: deptId,
      studentId,
      isActive: true,
    });

    const { accessToken, refreshToken } = this.generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    newUser.lastLoginAt = new Date();
    await newUser.save();

    const populatedUser = await User.findById(newUser._id)
      .populate('studentId')
      .populate('departmentId')
      .populate('assignedSectionId');

    return {
      user: {
        id: populatedUser!._id,
        email: populatedUser!.email,
        name: populatedUser!.name,
        role: populatedUser!.role,
        studentId: populatedUser!.studentId,
        departmentId: populatedUser!.departmentId,
        assignedSectionId: populatedUser!.assignedSectionId,
        permissions: populatedUser!.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  static async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return true;
  }

  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      designation?: string;
      officeCabin?: string;
      bio?: string;
    }
  ) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.designation !== undefined) updateData.designation = data.designation.trim();
    if (data.officeCabin !== undefined) updateData.officeCabin = data.officeCabin.trim();
    if (data.bio !== undefined) updateData.bio = data.bio.trim();

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .populate('departmentId')
      .populate('assignedSectionId')
      .populate('studentId');

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      phone: updatedUser.phone,
      designation: updatedUser.designation,
      officeCabin: updatedUser.officeCabin,
      bio: updatedUser.bio,
      studentId: updatedUser.studentId,
      departmentId: updatedUser.departmentId,
      assignedSectionId: updatedUser.assignedSectionId,
      permissions: updatedUser.permissions,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
    };
  }

  static async changePassword(userId: string, currentPasswordPlain: string, newPasswordPlain: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('Incorrect current password. Please verify and try again.');
    }

    if (!newPasswordPlain || newPasswordPlain.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPasswordPlain, salt);
    await user.save();

    return { success: true, message: 'Password changed successfully' };
  }
}

