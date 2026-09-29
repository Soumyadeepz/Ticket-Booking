import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seed.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Trust Vercel / reverse proxy headers
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Allow all Vercel preview/production domains, mobile browsers, LAN IPs, and localhost
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body & Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again shortly.',
  },
});
app.use('/api', globalLimiter);

// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'TicketBook API',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes under /api/* and root aliases
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/shows', showRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);

// 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let isDbConnected = false;
export const ensureDbConnected = async () => {
  if (isDbConnected) return;
  await connectDB();
  isDbConnected = true;
  try {
    await seedDatabase({ force: false });
  } catch (e) {
    console.warn('Seed check skipped:', e.message);
  }
};

const startServer = async () => {
  try {
    await ensureDbConnected();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 TicketBook Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

if (!process.env.VERCEL) {
  startServer();
}

export default async function serverlessHandler(req, res) {
  await ensureDbConnected();
  if (req.url && req.url.startsWith('/api/index')) {
    const parsed = new URL(req.url, 'http://localhost');
    const pathParam = parsed.searchParams.get('path') || req.query?.path;
    if (pathParam) {
      const subPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
      parsed.searchParams.delete('path');
      const qs = parsed.searchParams.toString();
      req.url = `/api/${subPath.replace(/^\/+/, '')}${qs ? `?${qs}` : ''}`;
    }
  }
  return app(req, res);
}
