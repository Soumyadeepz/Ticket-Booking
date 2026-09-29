import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  downloadTicketPdf,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import {
  validate,
  createBookingSchema,
  cancelBookingSchema,
} from '../validators/schemas.js';

const router = express.Router();

router.use(protect);

router.post('/', validate(createBookingSchema), createBooking);
router.get('/my', getMyBookings);
router.get('/:id/ticket', downloadTicketPdf);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', validate(cancelBookingSchema), cancelBooking);

export default router;
