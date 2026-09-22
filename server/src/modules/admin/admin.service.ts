import crypto from 'crypto';
import { SystemSetting } from '../../models/SystemSetting.js';
import { User } from '../../models/User.js';
import { Department } from '../../models/Department.js';
import { Student } from '../../models/Student.js';
import { ClassSection } from '../../models/ClassSection.js';
import { TrainingProgram } from '../../models/TrainingProgram.js';
import { TrainingEnrollment } from '../../models/TrainingEnrollment.js';
import { ROLES, UserRole } from '../../config/constants.js';

export class AdminService {
  /**
   * Fetch current institutional configuration and active role authorization keys
   */
  static async getSettings() {
    // Keys
    const officerSetting = await SystemSetting.findOne({ key: 'AUTH_KEY_PLACEMENT_OFFICER' });
    const hodSetting = await SystemSetting.findOne({ key: 'AUTH_KEY_HOD' });
    const inchargeSetting = await SystemSetting.findOne({ key: 'AUTH_KEY_CLASS_INCHARGE' });
    const facultySetting = await SystemSetting.findOne({ key: 'AUTH_KEY_FACULTY' });

    const keys = {
      placementOfficerKey: officerSetting?.value || process.env.AUTH_KEY_PLACEMENT_OFFICER || 'OFFICER@PLACERISE2026',
      hodKey: hodSetting?.value || process.env.AUTH_KEY_HOD || 'HOD@PLACERISE2026',
      classInchargeKey: inchargeSetting?.value || process.env.AUTH_KEY_CLASS_INCHARGE || 'INCHARGE@PLACERISE2026',
      facultyKey: facultySetting?.value || process.env.AUTH_KEY_FACULTY || 'FACULTY@PLACERISE2026',
      lastUpdatedOfficer: officerSetting?.updatedAt || null,
      lastUpdatedHod: hodSetting?.updatedAt || null,
      lastUpdatedIncharge: inchargeSetting?.updatedAt || null,
      lastUpdatedFaculty: facultySetting?.updatedAt || null,
    };

    // Institutional Profile
    const institutionSetting = await SystemSetting.findOne({ key: 'INSTITUTION_SETTINGS' });
    const institution = institutionSetting?.value || {
      collegeName: 'Placerise Institute of Technology & Engineering',
      collegeCode: 'PITE-AUTONOMOUS',
      accreditation: 'NAAC A++ Grade / AICTE Approved',
      placementHeadName: 'Dr. Arthur Pendelton',
      placementEmail: 'placement.cell@placerise.edu',
      placementPhone: '+91 44 2876 5432',
      minAttendanceBenchmark: 75,
      placementReadinessBenchmark: 70,
      activeAcademicYear: '2025-2026',
    };

    return { keys, institution };
  }

  /**
   * Update institutional profile / placement cell metadata
   */
  static async updateSettings(data: any, userId?: string) {
    const updated = await SystemSetting.findOneAndUpdate(
      { key: 'INSTITUTION_SETTINGS' },
      {
        value: data,
        description: 'College Profile and Placement Cell Configuration',
        updatedBy: userId,
      },
      { upsert: true, new: true }
    );
    return updated.value;
  }

  /**
   * Update authorization keys manually
   */
  static async updateKeys(
    data: { placementOfficerKey?: string; classInchargeKey?: string; facultyKey?: string },
    userId?: string
  ) {
    if (data.placementOfficerKey?.trim()) {
      await SystemSetting.findOneAndUpdate(
        { key: 'AUTH_KEY_PLACEMENT_OFFICER' },
        { value: data.placementOfficerKey.trim(), updatedBy: userId },
        { upsert: true }
      );
    }
    if ((data as any).hodKey?.trim()) {
      await SystemSetting.findOneAndUpdate(
        { key: 'AUTH_KEY_HOD' },
        { value: (data as any).hodKey.trim(), updatedBy: userId },
        { upsert: true }
      );
    }
    if (data.classInchargeKey?.trim()) {
      await SystemSetting.findOneAndUpdate(
        { key: 'AUTH_KEY_CLASS_INCHARGE' },
        { value: data.classInchargeKey.trim(), updatedBy: userId },
        { upsert: true }
      );
    }
    if (data.facultyKey?.trim()) {
      await SystemSetting.findOneAndUpdate(
        { key: 'AUTH_KEY_FACULTY' },
        { value: data.facultyKey.trim(), updatedBy: userId },
        { upsert: true }
      );
    }
    return this.getSettings();
  }

  /**
   * Rotate / auto-generate a secure authorization key for a specific role
   */
  static async rotateKey(role: UserRole, userId?: string) {
    const prefixMap: Record<string, string> = {
      [ROLES.PLACEMENT_OFFICER]: 'OFFICER',
      [ROLES.HOD]: 'HOD',
      [ROLES.CLASS_INCHARGE]: 'INCHARGE',
      [ROLES.FACULTY]: 'FACULTY',
    };
    const settingMap: Record<string, string> = {
      [ROLES.PLACEMENT_OFFICER]: 'AUTH_KEY_PLACEMENT_OFFICER',
      [ROLES.HOD]: 'AUTH_KEY_HOD',
      [ROLES.CLASS_INCHARGE]: 'AUTH_KEY_CLASS_INCHARGE',
      [ROLES.FACULTY]: 'AUTH_KEY_FACULTY',
    };

    const prefix = prefixMap[role] || 'SEC';
    const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const newKey = `${prefix}@${randPart}2026`;

    await SystemSetting.findOneAndUpdate(
      { key: settingMap[role] },
      {
        value: newKey,
        description: `Rotated Authorization Key for ${role}`,
        updatedBy: userId,
      },
      { upsert: true }
    );

    return { role, newKey };
  }

  /**
   * Get registered staff and user directory
   */
  static async getUsers(params: { role?: string; search?: string }) {
    const query: any = {};
    if (params.role) {
      query.role = params.role;
    }
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .populate('departmentId', 'code name')
      .populate('assignedSectionId', 'section displayName')
      .sort({ createdAt: -1 })
      .select('-passwordHash -refreshToken');

    // Counts
    const counts = {
      officer: await User.countDocuments({ role: ROLES.PLACEMENT_OFFICER }),
      classIncharge: await User.countDocuments({ role: ROLES.CLASS_INCHARGE }),
      faculty: await User.countDocuments({ role: ROLES.FACULTY }),
      student: await User.countDocuments({ role: ROLES.STUDENT }),
      totalActive: await User.countDocuments({ isActive: true }),
      totalSuspended: await User.countDocuments({ isActive: false }),
    };

    return { users, counts };
  }

  /**
   * Toggle user active status or role
   */
  static async updateUserStatus(userId: string, data: { isActive?: boolean; role?: UserRole }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (data.isActive !== undefined) user.isActive = data.isActive;
    if (data.role) user.role = data.role;

    await user.save();
    return user;
  }

  /**
   * Get department and system breakdown statistics
   */
  static async getSystemStats() {
    const departments = await Department.find({ isActive: true });
    const stats = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await Student.countDocuments({ departmentId: dept._id });
        const sectionCount = await ClassSection.countDocuments({ departmentId: dept._id });
        const programsCount = await TrainingProgram.countDocuments({
          targetDepartmentIds: dept._id,
        });

        return {
          id: dept._id,
          code: dept.code,
          name: dept.name,
          studentCount,
          sectionCount,
          programsCount,
        };
      })
    );

    const totalPrograms = await TrainingProgram.countDocuments();
    const totalEnrollments = await TrainingEnrollment.countDocuments();
    const totalStudents = await Student.countDocuments();

    return {
      departmentBreakdown: stats,
      totals: {
        totalDepartments: departments.length,
        totalPrograms,
        totalEnrollments,
        totalStudents,
      },
    };
  }
}
