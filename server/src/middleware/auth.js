import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from './errorHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Please sign in.', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new AppError('User belonging to this token no longer exists.', 401);
  }

  req.user = user;
  next();
});

export const isAdmin = asyncHandler(async (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Forbidden: Administrator privileges required.', 403);
  }
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore expired/invalid token for optional public routes
    }
  }
  next();
});
