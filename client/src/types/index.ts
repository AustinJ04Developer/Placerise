export type UserRole = 'placement_officer' | 'hod' | 'faculty' | 'class_incharge' | 'student';

export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  officeCabin?: string;
  bio?: string;
  studentId?: string | any;
  departmentId?: string | Department | any;
  assignedSectionId?: string | ClassSection | any;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Department {
  _id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  order: number;
}

export interface Batch {
  _id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

export interface ClassSection {
  _id: string;
  academicYearId: AcademicYear | string;
  departmentId: Department | string;
  batchId: Batch | string;
  yearOfStudy: number;
  section: string;
  displayName: string;
  facultyInchargeId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Student {
  _id: string;
  registerNumber: string;
  rollNumber: string;
  name: string;
  email: string;
  phone?: string;
  gender: 'Male' | 'Female' | 'Other';
  departmentId: Department | string;
  batchId: Batch | string;
  currentClassSectionId: ClassSection | string;
  currentYearOfStudy: number;
  currentSection: string;
  githubUrl?: string;
  linkedinUrl?: string;
  leetcodeUrl?: string;
  status: 'Active' | 'Graduated' | 'Discontinued';
}

export interface PlacementProfile {
  _id?: string;
  studentId: string;
  cgpa: number;
  activeBacklogs: number;
  historyOfBacklogs: number;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  leetcodeUrl?: string;
  preferredRoles: string[];
  skills: Array<{
    name: string;
    category: string;
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    verified: boolean;
  }>;
  readinessScore: number;
  placementStatus: 'Not Placed' | 'Placed' | 'Opted Out' | 'Higher Studies';
  placedCompany?: string;
  packageLPA?: number;
}

export interface TrainingCategory {
  _id: string;
  name: string;
  code: string;
  color: string;
  description?: string;
}

export interface TrainingProgram {
  _id: string;
  title: string;
  code: string;
  categoryId: TrainingCategory | string;
  academicYearId: AcademicYear | string;
  targetYears: number[];
  targetBatchIds?: (Batch | string)[];
  targetDepartmentIds: Department[] | string[];
  targetSections: string[];
  trainerName: string;
  startDate: string;
  endDate: string;
  classDays?: number[];
  excludedDates?: string[];
  specialActiveDates?: string[];
  gapPeriods?: {
    startDate: string;
    endDate: string;
    reason?: string;
  }[];
  totalPlannedHours: number;
  status: 'Planned' | 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  minAttendanceThreshold: number;
  description?: string;
}

export interface TrainingSession {
  _id: string;
  trainingProgramId: string;
  sessionNumber: number;
  title: string;
  sessionDate: string;
  durationHours: number;
  trainer: string;
  isCompleted: boolean;
}

export interface ProgramJourneyItem {
  enrollmentId: string;
  programId: string;
  title: string;
  code: string;
  category?: TrainingCategory;
  trainerName: string;
  status: 'Enrolled' | 'Completed' | 'Incomplete' | 'Dropped';
  attendancePercentage: number;
  totalSessions: number;
  attendedSessions: number;
  minAttendanceThreshold: number;
  hasAttendanceGap: boolean;
  assessments: Array<{
    resultId: string;
    title: string;
    type: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string;
    status: 'Passed' | 'Failed' | 'Absent';
  }>;
}

export interface YearJourney {
  yearOfStudy: number;
  academicYear: AcademicYear | null;
  classSection: ClassSection | null;
  sectionName?: string;
  rollNumber?: string;
  programs: ProgramJourneyItem[];
}

export interface StudentJourneyResponse {
  student: Student;
  overallStats: {
    totalAssigned: number;
    totalCompleted: number;
    completionRate: number;
    averageAttendance: number;
    totalGapsCount: number;
  };
  trainingGaps: string[];
  journey: YearJourney[];
}

export interface ClassMatrixData {
  totalStudents: number;
  programs: Array<{
    id: string;
    title: string;
    code: string;
    category: string;
    color: string;
    targetYears: number[];
    minAttendanceThreshold: number;
  }>;
  matrix: Array<{
    student: {
      id: string;
      name: string;
      registerNumber: string;
      rollNumber: string;
      email: string;
    };
    programs: Record<string, {
      enrolled: boolean;
      status: string;
      attendancePercentage: number;
      assessmentAverage?: number;
      hasGap: boolean;
    }>;
    summary: {
      totalAssigned: number;
      completed: number;
      completionPercentage: number;
      averageAttendance: number;
      hasHighRisk: boolean;
    };
  }>;
}

export interface ParticipationStatusResponse {
  program: {
    id: string;
    title: string;
    code: string;
    category: string;
    threshold: number;
    totalSessions: number;
  };
  metrics: {
    assignedCount: number;
    attendedCount: number;
    absentCount: number;
    pendingCount: number;
  };
  cohorts: {
    assigned: any[];
    attended: any[];
    absent: any[];
    pending: any[];
  };
}

export interface ApprovalRequestItem {
  _id: string;
  requestType: string;
  requesterId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  entityType: string;
  entityId: string;
  previousValue: any;
  proposedValue: any;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: {
    name: string;
    email: string;
  };
  reviewComment?: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  details?: string;
  createdAt: string;
}
