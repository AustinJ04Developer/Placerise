import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Valid institutional email is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z
    .enum([ROLES.PLACEMENT_OFFICER, ROLES.HOD, ROLES.CLASS_INCHARGE, ROLES.FACULTY, ROLES.STUDENT])
    .default(ROLES.FACULTY),
  staffAccessKey: z.string().optional(),
  departmentId: z.string().optional(),
  // For students
  registerNumber: z.string().trim().toUpperCase().optional(),
  rollNumber: z.string().trim().optional(),
  yearOfStudy: z.number().min(1).max(4).optional(),
  section: z.string().trim().toUpperCase().optional(),
});
