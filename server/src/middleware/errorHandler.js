import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, _next) => {
  // Zod Validation Error
  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: issues[0]?.message || 'Validation failed',
      errors: issues,
    });
  }

  // Mongoose duplicate key error (e.g., SeatHold unique index or Booking partial unique index)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    if (keys.includes('seatId') || keys.includes('seatIds') || keys.includes('show')) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats are already held or booked by another user.',
      });
    }
    const field = keys[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('❌ [Server Error]:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
};
