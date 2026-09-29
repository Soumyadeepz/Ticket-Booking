import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  getAdminStats,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  getAdminShows,
  createAdminShow,
  updateAdminShow,
  deleteAdminShow,
  getAdminBookings,
} from '../controllers/adminController.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Helper endpoint to promote the currently authenticated user to admin in development/demo environments
router.post(
  '/promote-me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.role = 'admin';
    await user.save();
    res.status(200).json({
      success: true,
      message: `${user.email} has been promoted to Admin!`,
      role: user.role,
    });
  })
);

// All routes below strictly enforce protect + isAdmin
router.use(protect, isAdmin);

router.get('/stats', getAdminStats);

router.post('/events', createAdminEvent);
router.put('/events/:id', updateAdminEvent);
router.delete('/events/:id', deleteAdminEvent);

router.get('/shows', getAdminShows);
router.post('/shows', createAdminShow);
router.put('/shows/:id', updateAdminShow);
router.delete('/shows/:id', deleteAdminShow);

router.get('/bookings', getAdminBookings);

export default router;
