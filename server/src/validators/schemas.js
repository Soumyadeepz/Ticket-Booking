import { z } from 'zod';

export const validate = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, _, ., and -')
    .transform((v) => v.toLowerCase()),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(2, 'Email or username is required')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Valid email is required')
    .transform((v) => v.toLowerCase()),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
  purpose: z.enum(['REGISTER', 'LOGIN']).optional(),
});

export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Valid email is required')
    .transform((v) => v.toLowerCase()),
  purpose: z.enum(['REGISTER', 'LOGIN']).optional(),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google ID token credential is required'),
  loginMode: z.enum(['user', 'admin']).optional().default('user'),
});

export const holdSeatsSchema = z.object({
  seatIds: z
    .array(z.string().trim().min(2).transform((s) => s.toUpperCase()))
    .min(1, 'Select at least 1 seat')
    .max(6, 'Maximum 6 seats can be held or booked at once'),
});

export const createBookingSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatIds: z
    .array(z.string().trim().min(2).transform((s) => s.toUpperCase()))
    .min(1, 'Select at least 1 seat')
    .max(6, 'Maximum 6 seats allowed per booking'),
  paymentMethod: z.enum(['CARD', 'UPI', 'WALLET', 'NETBANKING', 'RAZORPAY']).default('RAZORPAY'),
  initiatePayment: z.boolean().optional().default(false),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300).optional().default('Change of plans'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(25).optional(),
  avatar: z.string().trim().optional(),
  favoriteGenres: z.array(z.string()).optional(),
});
