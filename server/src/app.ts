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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'https://placerise.netlify.app',
];

if (process.env.CLIENT_URL) {
  const cleanUrl = process.env.CLIENT_URL.trim().replace(/\/+$/, '');
  if (!allowedOrigins.includes(cleanUrl)) {
    allowedOrigins.push(cleanUrl);
  }
}

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.includes(cleanOrigin)) return true;
  if (
    cleanOrigin.endsWith('.netlify.app') ||
    cleanOrigin.endsWith('.onrender.com') ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.includes('localhost') ||
    cleanOrigin.includes('127.0.0.1')
  ) {
    return true;
  }
  return true;
};

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, true);
      },
      credentials: true,
    })
  );
  app.use(express.json());

  // Root endpoint to prevent 404 on base server URL (e.g. Render dashboard link)
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      app: 'Placerise API Server',
      message: 'Placerise Placement Training Management & Progress Tracking System API is running smoothly.',
      endpoints: {
        health: '/api/health',
      },
      timestamp: new Date().toISOString(),
    });
  });

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

  // Catch-all 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}. Route not found on Placerise API server.`,
      health: '/api/health',
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};
