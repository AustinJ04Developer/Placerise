import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  errors?: Array<{ field?: string; message: string }>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    const val = (err as any).keyValue ? (err as any).keyValue[field] : '';
    message = `Duplicate value: '${val}' already exists for ${field}`;
    errors = [{ field, message }];
    res.status(409).json({ success: false, message, errors });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = 'Validation failed';
    const mongoErrors = (err as any).errors || {};
    errors = Object.keys(mongoErrors).map((key) => ({
      field: key,
      message: mongoErrors[key].message,
    }));
    res.status(400).json({ success: false, message, errors });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
      errors: [],
    });
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
