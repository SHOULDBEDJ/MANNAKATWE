import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense, uploadExpensePhoto } from '../controllers/expensesController.js';

const router = Router();

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.post('/:id/photo', upload.single('photo'), uploadExpensePhoto);

export default router;
