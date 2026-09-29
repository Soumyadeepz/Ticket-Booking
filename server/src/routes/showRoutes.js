import express from 'express';
import { getShowDetails, holdSeats } from '../controllers/showController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate, holdSeatsSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/:id', optionalAuth, getShowDetails);
router.post('/:id/hold', protect, validate(holdSeatsSchema), holdSeats);

export default router;
