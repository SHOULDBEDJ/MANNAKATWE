import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { 
  getBookings, getBookingById, createBooking, updateBooking, deleteBooking, 
  updateStatus, updateReturnStatus, updatePaymentStatus, uploadPhotos, deletePhoto 
} from '../controllers/bookingsController.js';

import { getInstallments, addInstallment, deleteInstallment } from '../controllers/installmentsController.js';

const router = Router();

router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);
router.put('/:id/status', updateStatus);
router.put('/:id/return-status', updateReturnStatus);
router.put('/:id/payment-status', updatePaymentStatus);

router.get('/:id/installments', getInstallments);
router.post('/:id/installments', addInstallment);
router.delete('/:id/installments/:installmentId', deleteInstallment);

router.post('/:id/photos', upload.array('photos', 10), uploadPhotos);
router.delete('/:id/photos/:photoId', deletePhoto);

export default router;
