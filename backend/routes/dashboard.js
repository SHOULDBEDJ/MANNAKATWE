import { Router } from 'express';
import { getKpis, getCalendar, getBookingsByDate, getOverdue, markOverdueDelivered, getRecent } from '../controllers/dashboardController.js';

const router = Router();

router.get('/kpis', getKpis);
router.get('/calendar', getCalendar);
router.get('/bookings-by-date', getBookingsByDate);
router.get('/overdue', getOverdue);
router.put('/mark-overdue-delivered', markOverdueDelivered);
router.get('/recent', getRecent);

export default router;
