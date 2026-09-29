import jwt from 'jsonwebtoken';

const getAccessSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_ACCESS_SECRET) {
    throw new Error('FATAL: JWT_ACCESS_SECRET environment variable is required in production.');
  }
  return process.env.JWT_ACCESS_SECRET || 'ticketbook_dev_only_access_secret';
};

const getRefreshSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is required in production.');
  }
  return process.env.JWT_REFRESH_SECRET || 'ticketbook_dev_only_refresh_secret';
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role || 'user',
    },
    getAccessSecret(),
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenType: 'refresh',
    },
    getRefreshSecret(),
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

export const setRefreshCookie = (res, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearRefreshCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};
