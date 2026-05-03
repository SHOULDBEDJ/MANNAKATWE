import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import bookingsRouter from './routes/bookings.js';
import customersRouter from './routes/customers.js';
import expensesRouter from './routes/expenses.js';
import galleryRouter from './routes/gallery.js';
import profileRouter from './routes/profile.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import installmentsRouter from './routes/installments.js';
import upiIdsRouter from './routes/upiIds.js';
import customerTypesRouter from './routes/customerTypes.js';
import functionTypesRouter from './routes/functionTypes.js';
import expenseTypesRouter from './routes/expenseTypes.js';
import voiceNoteRoutes from './routes/voiceNotes.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import historyRouter from './routes/history.js';

app.use('/api/bookings', bookingsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/profile', profileRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/installments', installmentsRouter);
app.use('/api/upi-ids', upiIdsRouter);
app.use('/api/customer-types', customerTypesRouter);
app.use('/api/function-types', functionTypesRouter);
app.use('/api/expense-types', expenseTypesRouter);
app.use('/api/voice-notes', voiceNoteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRouter);

import { upload } from './middleware/upload.js';
import { uploadFile } from './controllers/profileController.js';

app.post('/api/upload', upload.single('file'), uploadFile);

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.listen(process.env.PORT || 5000, () =>
  console.log(`Backend running on port ${process.env.PORT || 5000}`)
);

export default app;
