import express from 'express';
import { getCustomerHistory, getCustomerBookings } from '../controllers/historyController.js';

const router = express.Router();

router.get('/customers', getCustomerHistory);
router.get('/customers/:id/bookings', getCustomerBookings);

export default router;
