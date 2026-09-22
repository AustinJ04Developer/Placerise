import { Student } from '../../models/Student.js';
import { TrainingProgram } from '../../models/TrainingProgram.js';
import { TrainingSession } from '../../models/TrainingSession.js';
import { TrainingEnrollment } from '../../models/TrainingEnrollment.js';
import { ApprovalRequest } from '../../models/ApprovalRequest.js';
import { Department } from '../../models/Department.js';
import { PlacementProfile } from '../../models/PlacementProfile.js';
import { ROLES, UserRole } from '../../config/constants.js';

export class DashboardService {
  static async getStats(user: any) {
    if (user.role === ROLES.PLACEMENT_OFFICER) {
      const [
        totalStudents,
        totalPrograms,
        upcomingSessions,
        pendingApprovals,
        departments,
        highRiskCount,
        allEnrollments,
      ] = await Promise.all([
        Student.countDocuments({ status: 'Active' }),
        TrainingProgram.countDocuments(),
        TrainingSession.countDocuments({ sessionDate: { $gte: new Date() } }),
        ApprovalRequest.countDocuments({ status: 'Pending' }),
        Department.find({ isActive: true }).select('code name'),
        TrainingEnrollment.countDocuments({ hasGap: true }),
        TrainingEnrollment.find().select('attendancePercentage status'),
      ]);

      const avgAttendance =
        allEnrollments.length > 0
          ? Math.round(
              allEnrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                allEnrollments.length
            )
          : 0;

      const completedEnrollments = allEnrollments.filter((e) => e.status === 'Completed').length;
      const completionRate =
        allEnrollments.length > 0
          ? Math.round((completedEnrollments / allEnrollments.length) * 100)
          : 0;

      // Dynamic Charts Data
      const categories = await Department.find(); // or TrainingCategory
      const { TrainingCategory } = await import('../../models/TrainingCategory.js');
      const allCategories = await TrainingCategory.find().sort({ order: 1 });
      const categoryData = await Promise.all(
        allCategories.map(async (cat) => {
          const count = await TrainingProgram.countDocuments({ categoryId: cat._id });
          return {
            name: cat.name,
            value: count,
          };
        })
      );

      const recentPrograms = await TrainingProgram.find().sort({ createdAt: -1 }).limit(8);
      const attendanceData = await Promise.all(
        recentPrograms.map(async (p) => {
          const enrollments = await TrainingEnrollment.find({ trainingProgramId: p._id });
          const avgAtt =
            enrollments.length > 0
              ? Math.round(
                  enrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                    enrollments.length
                )
              : 0;
          return {
            name: p.code || p.title.slice(0, 10),
            attendance: avgAtt,
            benchmark: p.minAttendanceThreshold || 75,
          };
        })
      );

      return {
        role: ROLES.PLACEMENT_OFFICER,
        cards: {
          totalStudents,
          activePrograms: totalPrograms,
          averageAttendance: avgAttendance,
          completionRate,
          pendingApprovals,
          studentsWithGaps: highRiskCount,
          upcomingSessions,
        },
        charts: {
          attendanceData,
          categoryData,
        },
        departments,
      };
    } else if (user.role === ROLES.HOD) {
      const deptId = user.departmentId;
      const deptQuery = deptId ? { departmentId: deptId } : {};
      const programDeptQuery = deptId ? { targetDepartmentIds: deptId } : {};

      const { User } = await import('../../models/User.js');
      const deptUsers = deptId ? await User.find({ departmentId: deptId }).select('_id') : [];
      const deptUserIds = deptUsers.map((u) => u._id);
      const pendingApprovalQuery: any = { status: 'Pending' };
      if (deptId && deptUserIds.length > 0) {
        pendingApprovalQuery.requesterId = { $in: deptUserIds };
      }

      const [
        totalStudents,
        deptPrograms,
        upcomingSessions,
        pendingApprovals,
        allDeptEnrollments,
        department,
      ] = await Promise.all([
        Student.countDocuments({ status: 'Active', ...deptQuery }),
        TrainingProgram.find(programDeptQuery),
        TrainingSession.countDocuments({ sessionDate: { $gte: new Date() } }),
        ApprovalRequest.countDocuments(pendingApprovalQuery),
        TrainingEnrollment.find().populate({
          path: 'studentId',
          match: deptQuery,
          select: '_id',
        }),
        deptId ? Department.findById(deptId) : null,
      ]);

      const validEnrollments = allDeptEnrollments.filter((e) => e.studentId != null);

      const avgAttendance =
        validEnrollments.length > 0
          ? Math.round(
              validEnrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                validEnrollments.length
            )
          : 0;

      const completed = validEnrollments.filter((e) => e.status === 'Completed').length;
      const completionRate =
        validEnrollments.length > 0 ? Math.round((completed / validEnrollments.length) * 100) : 0;

      const atRiskCount = validEnrollments.filter(
        (e) => e.hasGap || e.attendancePercentage < 75
      ).length;

      const { TrainingCategory } = await import('../../models/TrainingCategory.js');
      const allCategories = await TrainingCategory.find().sort({ order: 1 });
      const categoryData = await Promise.all(
        allCategories.map(async (cat) => {
          const count = await TrainingProgram.countDocuments({
            categoryId: cat._id,
            ...programDeptQuery,
          });
          return { name: cat.name, value: count };
        })
      );

      const recentPrograms = deptPrograms.slice(0, 8);
      const attendanceData = await Promise.all(
        recentPrograms.map(async (p) => {
          const enrollments = await TrainingEnrollment.find({ trainingProgramId: p._id });
          const avgAtt =
            enrollments.length > 0
              ? Math.round(
                  enrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                    enrollments.length
                )
              : 0;
          return {
            name: p.code || p.title.slice(0, 10),
            attendance: avgAtt,
            benchmark: p.minAttendanceThreshold || 75,
          };
        })
      );

      return {
        role: ROLES.HOD,
        departmentName: department?.name || 'Department',
        departmentCode: department?.code || '',
        cards: {
          totalStudents,
          activePrograms: deptPrograms.length,
          averageAttendance: avgAttendance,
          completionRate,
          pendingApprovals,
          studentsWithGaps: atRiskCount,
          upcomingSessions,
        },
        charts: {
          attendanceData,
          categoryData,
        },
      };
    } else if (user.role === ROLES.CLASS_INCHARGE) {
      const sectionId = user.assignedSectionId;
      const students = await Student.find({ currentClassSectionId: sectionId });
      const studentIds = students.map((s) => s._id);

      const enrollments = await TrainingEnrollment.find({ studentId: { $in: studentIds } });
      const avgAttendance =
        enrollments.length > 0
          ? Math.round(
              enrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                enrollments.length
            )
          : 0;

      const completed = enrollments.filter((e) => e.status === 'Completed').length;
      const atRisk = enrollments.filter((e) => e.hasGap || e.attendancePercentage < 75).length;

      return {
        role: ROLES.CLASS_INCHARGE,
        cards: {
          classStudentsCount: students.length,
          averageAttendance: avgAttendance,
          trainingCompletionRate:
            enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0,
          atRiskCount: atRisk,
        },
      };
    } else if (user.role === ROLES.STUDENT) {
      const studentId = user.studentId;
      const enrollments = await TrainingEnrollment.find({ studentId }).populate('trainingProgramId');
      const profile = await PlacementProfile.findOne({ studentId });

      const avgAttendance =
        enrollments.length > 0
          ? Math.round(
              enrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
                enrollments.length
            )
          : 0;
      const completed = enrollments.filter((e) => e.status === 'Completed').length;

      return {
        role: ROLES.STUDENT,
        cards: {
          enrolledProgramsCount: enrollments.length,
          completedCount: completed,
          attendancePercentage: avgAttendance,
          readinessScore: profile?.readinessScore || 0,
          cgpa: profile?.cgpa || 0,
          activeBacklogs: profile?.activeBacklogs || 0,
        },
      };
    }

    // Default Faculty
    const programsCount = await TrainingProgram.countDocuments();
    return {
      role: ROLES.FACULTY,
      cards: {
        assignedProgramsCount: programsCount,
        pendingAttendanceCount: 0,
        activeAssessmentsCount: 0,
      },
    };
  }
}
