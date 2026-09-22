import { z } from 'zod';
import { PROGRAM_STATUS } from '../config/constants.js';

export const createProgramSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim(),
  code: z.string().min(2, 'Course/Program code is required').trim().toUpperCase(),
  categoryId: z.string().min(1, 'Category is required'),
  academicYearId: z.string().min(1, 'Academic Year is required'),
  targetYears: z.array(z.number().min(1).max(4)).min(1, 'At least one target year is required'),
  targetBatchIds: z.array(z.string()).optional().default([]),
  targetDepartmentIds: z.array(z.string()).min(1, 'At least one target department is required'),
  targetSections: z.array(z.string()).optional().default(['A']),
  trainerName: z.string().min(2, 'Trainer name is required').trim(),
  trainerEmail: z.string().email().optional().or(z.literal('')),
  trainerOrganization: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  classDays: z.array(z.number().min(0).max(6)).optional().default([1, 2, 3, 4, 5, 6]),
  excludedDates: z.array(z.string()).optional().default([]),
  specialActiveDates: z.array(z.string()).optional().default([]),
  gapPeriods: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
    })
  ).optional().default([]),
  totalPlannedHours: z.number().min(1).optional().default(40),
  dailyHours: z.number().min(0.5).max(24).optional().default(2),
  autoGenerateSessions: z.boolean().optional().default(true),
  status: z.enum([PROGRAM_STATUS.PLANNED, PROGRAM_STATUS.SCHEDULED, PROGRAM_STATUS.ONGOING, PROGRAM_STATUS.COMPLETED, PROGRAM_STATUS.CANCELLED]).optional(),
  minAttendanceThreshold: z.number().min(0).max(100).optional().default(75),
  description: z.string().optional(),
});

export const updateProgramSchema = createProgramSchema.partial().extend({
  regenerateSessions: z.boolean().optional(),
});

export const assignProgramSchema = z.object({
  targetType: z.enum(['SECTION', 'DEPARTMENT', 'STUDENTS', 'INTERDEPARTMENT', 'BATCH']),
  sectionId: z.string().optional(),
  departmentId: z.string().optional(),
  departmentIds: z.array(z.string()).optional(),
  batchId: z.string().optional(),
  batchIds: z.array(z.string()).optional(),
  yearOfStudy: z.number().min(1).max(4).optional(),
  studentIds: z.array(z.string()).optional(),
});

export const extendProgramSchema = z.object({
  extendDays: z.number().min(1).optional(),
  newEndDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }).optional(),
  dailyHours: z.number().min(0.5).max(24).optional().default(2),
  remarks: z.string().optional(),
});

export const createSessionSchema = z.object({
  trainingProgramId: z.string().min(1, 'Program ID is required'),
  title: z.string().min(2, 'Session title is required').trim(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationHours: z.number().min(0.5).optional().default(2),
  trainer: z.string().optional(),
  venue: z.string().optional(),
  topicsCovered: z.array(z.string()).optional(),
});

export const submitAttendanceSchema = z.object({
  trainingSessionId: z.string().min(1, 'Training session ID is required'),
  records: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one attendance record is required'),
});

export const submitAssessmentResultsSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  results: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      score: z.number().min(0),
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one result record is required'),
});
