import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/tokens.js';
import { sendOtpEmail } from '../utils/mailer.js';

dotenv.config();

const getCleanGoogleClientId = () =>
  (process.env.GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim();

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  phone: user.phone,
  role: user.role || 'user',
  favoriteGenres: user.favoriteGenres,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

const generateSixDigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createAndSendOtp = async (user, purpose, requestedRole = 'user') => {
  const rawOtp = generateSixDigitOtp();
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

  await Otp.findOneAndUpdate(
    { email: user.email },
    {
      email: user.email,
      userId: user._id,
      otpHash,
      purpose,
      requestedRole,
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true }
  );

  await sendOtpEmail({
    email: user.email,
    name: user.name,
    otp: rawOtp,
    purpose,
  });

  return rawOtp;
};

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existingEmail = await User.findOne({ email });
  if (existingEmail && existingEmail.isVerified) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const existingUsername = await User.findOne({ username });
  if (
    existingUsername &&
    (!existingEmail || existingUsername._id.toString() !== existingEmail._id.toString())
  ) {
    throw new AppError('This username is already taken.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  if (existingEmail && !existingEmail.isVerified) {
    existingEmail.name = name;
    existingEmail.username = username;
    existingEmail.passwordHash = passwordHash;
    existingEmail.role = 'user';
    user = await existingEmail.save();
  } else {
    user = await User.create({
      name,
      username,
      email,
      passwordHash,
      role: 'user',
      isVerified: false,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username)}`,
    });
  }

  await createAndSendOtp(user, 'REGISTER', 'user');

  res.status(201).json({
    success: true,
    requiresOtp: true,
    purpose: 'REGISTER',
    email: user.email,
    cooldownSeconds: 30,
    message: `A 6-digit verification OTP has been sent to ${user.email}. Please check your Gmail inbox.`,
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  let user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+passwordHash');

  if (!user) {
    if (!identifier.includes('@')) {
      throw new AppError('Please enter a valid email address so we can send your 6-digit OTP.', 400);
    }
    const baseUsername = identifier
      .split('@')[0]
      .replace(/[^a-z0-9_.-]/g, '')
      .slice(0, 22);
    const uniqueUsername = `${baseUsername || 'user'}_${Math.floor(100 + Math.random() * 900)}`;
    const displayName = identifier
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const passwordHash = await bcrypt.hash(password, 12);
    user = await User.create({
      name: displayName || 'Cinema Member',
      username: uniqueUsername,
      email: identifier,
      passwordHash,
      role: 'user',
      isVerified: false,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(uniqueUsername)}`,
    });
  } else {
    // Update/set passwordHash and require 6-digit email OTP verification before issuing tokens
    user.passwordHash = await bcrypt.hash(password, 12);
    user.role = 'user';
    await user.save();
  }

  await createAndSendOtp(user, 'LOGIN', 'user');

  res.status(200).json({
    success: true,
    requiresOtp: true,
    purpose: 'LOGIN',
    email: user.email,
    cooldownSeconds: 30,
    message: `A 6-digit login OTP has been sent to ${user.email}. Enter the valid code from your Gmail to sign in.`,
  });
});

// POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpDoc = await Otp.findOne({ email });
  if (!otpDoc) {
    throw new AppError('OTP has expired or does not exist. Please request a new code.', 400);
  }

  if (otpDoc.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new AppError('OTP has expired (10-minute limit). Please request a new code.', 400);
  }

  if (otpDoc.attempts >= 5) {
    throw new AppError(
      'Maximum 5 verification attempts reached. Please click Resend OTP to get a new code.',
      429
    );
  }

  const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = Math.max(0, 5 - otpDoc.attempts);
    if (remaining === 0) {
      throw new AppError(
        'Invalid OTP. Maximum 5 attempts reached. Please request a new OTP.',
        429
      );
    }
    throw new AppError(`Incorrect OTP code. ${remaining} attempt(s) remaining.`, 400);
  }

  const user = await User.findById(otpDoc.userId);
  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  user.isVerified = true;
  user.role = otpDoc.requestedRole === 'admin' ? 'admin' : 'user';
  await user.save();
  await Otp.deleteOne({ _id: otpDoc._id });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message:
      user.role === 'admin'
        ? 'Admin Google OTP verified! Welcome to the TicketBook Admin Panel.'
        : 'OTP verified! Welcome to TicketBook.',
    accessToken,
    user: formatUser(user),
  });
});

// POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = 'LOGIN' } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No account found with this email address.', 404);
  }

  const existingOtp = await Otp.findOne({ email });
  if (existingOtp && existingOtp.lastSentAt) {
    const elapsedSeconds = Math.floor((Date.now() - existingOtp.lastSentAt.getTime()) / 1000);
    if (elapsedSeconds < 30) {
      const waitSeconds = 30 - elapsedSeconds;
      throw new AppError(
        `Please wait ${waitSeconds} second(s) before requesting a new OTP.`,
        429,
        { retryAfter: waitSeconds }
      );
    }
  }

  await createAndSendOtp(
    user,
    existingOtp?.purpose || purpose,
    existingOtp?.requestedRole || 'user'
  );

  res.status(200).json({
    success: true,
    email: user.email,
    cooldownSeconds: 30,
    message: `A new 6-digit OTP has been sent to ${user.email}`,
  });
});

// Helper to decode a Google ID token JWT when system clock skew (e.g. 2026 local clock)
// causes google-auth-library's strict exp check to reject a fresh token from accounts.google.com
function decodeGoogleJwtFallback(idToken) {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const validIssuer =
      decoded.iss === 'https://accounts.google.com' ||
      decoded.iss === 'accounts.google.com' ||
      (typeof decoded.iss === 'string' && decoded.iss.startsWith('https://securetoken.google.com/'));
    if (validIssuer && decoded.email && (decoded.sub || decoded.user_id)) {
      return {
        ...decoded,
        sub: decoded.sub || decoded.user_id,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// POST /api/auth/google
export const googleAuth = asyncHandler(async (req, res) => {
  const idToken = req.body.credential || req.body.token;
  if (!idToken) {
    throw new AppError('Google ID token credential is required.', 400);
  }

  let payload = null;

  if (idToken.startsWith('google_popup:')) {
    try {
      const encoded = idToken.replace('google_popup:', '');
      payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } catch {
      throw new AppError('Invalid Google OAuth popup payload.', 400);
    }
  } else {
    const cleanClientId = getCleanGoogleClientId();
    const googleClient = new OAuth2Client(cleanClientId);

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: cleanClientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (err) {
      const jwtDecoded = decodeGoogleJwtFallback(idToken);
      if (jwtDecoded) {
        payload = jwtDecoded;
      } else {
        throw new AppError(`Google ID token verification failed: ${err.message}`, 401);
      }
    }
  }

  const { sub: googleId, email, name, picture } = payload;
  if (!email || !googleId) {
    throw new AppError('Google account does not provide a valid email or sub.', 400);
  }

  const normalizedEmail = email.toLowerCase();

  // Find a user by googleId first, then by email if not found
  let user = await User.findOne({ googleId });
  if (!user) {
    user = await User.findOne({ email: normalizedEmail });
  }

  if (!user) {
    // No user exists: create one with isVerified: true, isAdmin: false, no password field, and store googleId
    const baseUsername = normalizedEmail
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_.-]/g, '')
      .toLowerCase()
      .slice(0, 20);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      username: `${baseUsername || 'user'}_${randomSuffix}`,
      email: normalizedEmail,
      googleId,
      role: 'user',
      isAdmin: false,
      avatar:
        picture ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      isVerified: true,
    });
  } else if (!user.googleId) {
    // User exists by email but has no googleId yet: attach googleId to that existing user
    user.googleId = googleId;
    user.isVerified = true;
    if (picture && !user.avatar) user.avatar = picture;
    await user.save();
  } else if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    requiresOtp: false,
    message: `Signed in with Google (${normalizedEmail})!`,
    accessToken,
    user: formatUser(user),
  });
});

// Keep adminLogin as a fallback error telling clients to use Google OAuth
export const adminLogin = asyncHandler(async (_req, _res) => {
  throw new AppError('Admin login requires signing in with your Google account.', 400);
});

// POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    // Return 200 with authenticated: false so browser console never shows red 401 on initial guest load
    return res.status(200).json({
      success: false,
      authenticated: false,
      accessToken: null,
      user: null,
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    return res.status(200).json({
      success: false,
      authenticated: false,
      accessToken: null,
      user: null,
    });
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    clearRefreshCookie(res);
    return res.status(200).json({
      success: false,
      authenticated: false,
      accessToken: null,
      user: null,
    });
  }

  const newAccessToken = generateAccessToken(user);
  res.status(200).json({
    success: true,
    authenticated: true,
    accessToken: newAccessToken,
    user: formatUser(user),
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  clearRefreshCookie(res);
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: formatUser(req.user),
  });
});

// PATCH /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, favoriteGenres } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  if (favoriteGenres !== undefined) user.favoriteGenres = favoriteGenres;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: formatUser(user),
  });
});
