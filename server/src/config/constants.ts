export const ROLES = {
  PLACEMENT_OFFICER: 'placement_officer',
  HOD: 'hod',
  CLASS_INCHARGE: 'class_incharge',
  FACULTY: 'faculty',
  STUDENT: 'student',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  EXCUSED: 'Excused',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

export const PROGRAM_STATUS = {
  PLANNED: 'Planned',
  SCHEDULED: 'Scheduled',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export type ProgramStatus = typeof PROGRAM_STATUS[keyof typeof PROGRAM_STATUS];

export const ENROLLMENT_STATUS = {
  ENROLLED: 'Enrolled',
  COMPLETED: 'Completed',
  INCOMPLETE: 'Incomplete',
  DROPPED: 'Dropped',
} as const;

export type EnrollmentStatus = typeof ENROLLMENT_STATUS[keyof typeof ENROLLMENT_STATUS];

export const ASSESSMENT_TYPE = {
  QUIZ: 'Quiz',
  CODING: 'Coding',
  MOCK: 'Mock',
  THEORY: 'Theory',
} as const;

export type AssessmentType = typeof ASSESSMENT_TYPE[keyof typeof ASSESSMENT_TYPE];

export const APPROVAL_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];
