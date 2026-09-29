import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  adminLogin,
  verifyOtp,
  resendOtp,
  googleAuth,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validate,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  googleLoginSchema,
  updateProfileSchema,
} from '../validators/schemas.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    message: 'Too many authentication requests from this IP. Please try again in 15 minutes.',
  },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please wait a few minutes.',
  },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin-login', authLimiter, validate(loginSchema), adminLogin);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), resendOtp);
router.post('/google', authLimiter, validate(googleLoginSchema), googleAuth);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);

export default router;
