import jwt from 'jsonwebtoken';

const getAccessSecret = () => {
  return process.env.JWT_ACCESS_SECRET || 'ticketbook_super_secret_access_key_2026';
};

const getRefreshSecret = () => {
  return process.env.JWT_REFRESH_SECRET || 'ticketbook_super_secret_refresh_key_2026';
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
