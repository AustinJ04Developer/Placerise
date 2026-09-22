import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { StudentAcademicHistory } from '../models/StudentAcademicHistory.js';
import { PlacementProfile } from '../models/PlacementProfile.js';
import { TrainingProgram } from '../models/TrainingProgram.js';
import { TrainingSession } from '../models/TrainingSession.js';
import { TrainingEnrollment } from '../models/TrainingEnrollment.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentResult } from '../models/AssessmentResult.js';
import { ApprovalRequest } from '../models/ApprovalRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { ClassSection } from '../models/ClassSection.js';

dotenv.config();

const PRESERVED_EMAIL = 'placement@marephraem.edu.in'.toLowerCase().trim();

export async function cleanupData() {
  console.log('Connecting to database...');
  await connectDB();

  console.log(`\n==================================================`);
  console.log(`DATA CLEANUP STARTED`);
  console.log(`Preserving User: ${PRESERVED_EMAIL}`);
  console.log(`==================================================\n`);

  // 1. Check preserved user
  const preservedUser = await User.findOne({
    email: { $regex: new RegExp(`^${PRESERVED_EMAIL}$`, 'i') },
  });

  if (preservedUser) {
    console.log(`[Preserved User Found]`);
    console.log(`- ID: ${preservedUser._id}`);
    console.log(`- Name: ${preservedUser.name}`);
    console.log(`- Email: ${preservedUser.email}`);
    console.log(`- Role: ${preservedUser.role}`);
  } else {
    console.warn(`[WARNING] User '${PRESERVED_EMAIL}' was not found in the database.`);
    console.warn(`If this user has not registered yet, they will not be affected.`);
  }

  // 2. Remove all users except preserved user
  const userDeleteResult = await User.deleteMany({
    email: { $not: new RegExp(`^${PRESERVED_EMAIL}$`, 'i') },
  });
  console.log(`[Users] Deleted ${userDeleteResult.deletedCount} user(s).`);

  // 3. Remove all training sample data
  const trainingEnrollmentsResult = await TrainingEnrollment.deleteMany({});
  console.log(`[TrainingEnrollments] Deleted ${trainingEnrollmentsResult.deletedCount} record(s).`);

  const attendanceRecordsResult = await AttendanceRecord.deleteMany({});
  console.log(`[AttendanceRecords] Deleted ${attendanceRecordsResult.deletedCount} record(s).`);

  const assessmentResultsResult = await AssessmentResult.deleteMany({});
  console.log(`[AssessmentResults] Deleted ${assessmentResultsResult.deletedCount} record(s).`);

  const assessmentsResult = await Assessment.deleteMany({});
  console.log(`[Assessments] Deleted ${assessmentsResult.deletedCount} record(s).`);

  const trainingSessionsResult = await TrainingSession.deleteMany({});
  console.log(`[TrainingSessions] Deleted ${trainingSessionsResult.deletedCount} record(s).`);

  const trainingProgramsResult = await TrainingProgram.deleteMany({});
  console.log(`[TrainingPrograms] Deleted ${trainingProgramsResult.deletedCount} record(s).`);

  // 4. Remove all student sample data
  const placementProfilesResult = await PlacementProfile.deleteMany({});
  console.log(`[PlacementProfiles] Deleted ${placementProfilesResult.deletedCount} record(s).`);

  const studentHistoriesResult = await StudentAcademicHistory.deleteMany({});
  console.log(`[StudentAcademicHistories] Deleted ${studentHistoriesResult.deletedCount} record(s).`);

  const studentsResult = await Student.deleteMany({});
  console.log(`[Students] Deleted ${studentsResult.deletedCount} record(s).`);

  // 5. Remove approval requests, notifications, and audit logs from sample data
  const approvalRequestsResult = await ApprovalRequest.deleteMany({});
  console.log(`[ApprovalRequests] Deleted ${approvalRequestsResult.deletedCount} record(s).`);

  const notificationsResult = await Notification.deleteMany({});
  console.log(`[Notifications] Deleted ${notificationsResult.deletedCount} record(s).`);

  const auditLogsResult = await AuditLog.deleteMany({});
  console.log(`[AuditLogs] Deleted ${auditLogsResult.deletedCount} record(s).`);

  // 6. Reset facultyIncharge references in ClassSections
  const updateSectionsResult = await ClassSection.updateMany(
    {},
    { $unset: { facultyInchargeId: 1 } }
  );
  console.log(`[ClassSections] Reset facultyInchargeId for ${updateSectionsResult.matchedCount} section(s).`);

  console.log(`\n==================================================`);
  console.log(`DATA CLEANUP COMPLETED SUCCESSFULLY`);
  console.log(`==================================================\n`);
}

// Auto-run if executed directly
if (process.argv[1]?.includes('cleanupData')) {
  cleanupData()
    .then(() => {
      console.log('Cleanup script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during cleanup:', err);
      process.exit(1);
    });
}
