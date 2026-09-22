import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './modules/auth/auth.routes.js';
import { academicsRoutes } from './modules/academics/academics.routes.js';
import { studentsRoutes } from './modules/students/students.routes.js';
import { trainingRoutes } from './modules/training/training.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { assessmentsRoutes } from './modules/assessments/assessments.routes.js';
import { approvalsRoutes } from './modules/approvals/approvals.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { notificationRoutes } from './modules/notifications/notifications.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Max 1000 requests per 15 min
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50, // 50 attempts per 15 min
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many login/registration attempts, please try again later.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);


  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'Placerise Placement Training Management & Progress Tracking System',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/academics', academicsRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/assessments', assessmentsRoutes);
  app.use('/api/approvals', approvalsRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/admin', adminRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
};
