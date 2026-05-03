import { db } from '../db/client.js';

export const getInstallments = async (req, res) => {
  const { id } = req.params;
  
  try {
    const bookingResult = await db.execute({
      sql: 'SELECT total_amount, partial_amount FROM bookings WHERE id = ?',
      args: [id]
    });
    
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = bookingResult.rows[0];

    const instResult = await db.execute({
      sql: 'SELECT * FROM installments WHERE booking_id = ? ORDER BY paid_at ASC',
      args: [id]
    });

    let totalInstallmentsPaid = 0;
    instResult.rows.forEach(r => totalInstallmentsPaid += Number(r.amount));

    const totalAmount = Number(booking.total_amount) || 0;
    const partialAmount = Number(booking.partial_amount) || 0;
    const totalPaid = partialAmount + totalInstallmentsPaid;
    const pendingBalance = totalAmount - totalPaid;

    res.json({
      installments: instResult.rows,
      total_installments_paid: totalInstallmentsPaid,
      partial_amount: partialAmount,
      total_amount: totalAmount,
      total_paid: totalPaid,
      pending_balance: pendingBalance > 0 ? pendingBalance : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addInstallment = async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method, upi_id, paid_at, notes } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

  try {
    // Check balance
    const bookingResult = await db.execute({ sql: 'SELECT total_amount, partial_amount FROM bookings WHERE id = ?', args: [id] });
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = bookingResult.rows[0];

    const instResult = await db.execute({ sql: 'SELECT amount FROM installments WHERE booking_id = ?', args: [id] });
    let totalInstallmentsPaid = 0;
    instResult.rows.forEach(r => totalInstallmentsPaid += Number(r.amount));

    const totalAmount = Number(booking.total_amount) || 0;
    const partialAmount = Number(booking.partial_amount) || 0;
    const currentPending = totalAmount - (partialAmount + totalInstallmentsPaid);

    if (Number(amount) > currentPending) {
      return res.status(400).json({ error: `Amount exceeds pending balance of ₹${currentPending}` });
    }

    const insertRes = await db.execute({
      sql: 'INSERT INTO installments (booking_id, amount, payment_method, upi_id, paid_at, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
      args: [
        id, 
        amount, 
        payment_method || 'Cash', 
        upi_id || null, 
        paid_at || new Date().toISOString(), 
        notes || null
      ]
    });

    const newRow = insertRes.rows[0];
    
    // Recalculate
    const newPending = currentPending - Number(amount);
    let paymentStatusUpdated = false;

    if (newPending <= 0) {
      await db.execute({ sql: "UPDATE bookings SET payment_status = 'Paid' WHERE id = ?", args: [id] });
      paymentStatusUpdated = true;
    }

    res.status(201).json({ installment: newRow, paymentStatusUpdated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInstallment = async (req, res) => {
  const { id, installmentId } = req.params;

  try {
    // Check if it exists
    const instCheck = await db.execute({ sql: 'SELECT * FROM installments WHERE id = ? AND booking_id = ?', args: [installmentId, id] });
    if (instCheck.rows.length === 0) return res.status(404).json({ error: 'Installment not found' });

    await db.execute({ sql: 'DELETE FROM installments WHERE id = ?', args: [installmentId] });

    // Recalculate balance
    const bookingResult = await db.execute({ sql: 'SELECT total_amount, partial_amount, payment_status FROM bookings WHERE id = ?', args: [id] });
    const booking = bookingResult.rows[0];

    const instResult = await db.execute({ sql: 'SELECT amount FROM installments WHERE booking_id = ?', args: [id] });
    let totalInstallmentsPaid = 0;
    instResult.rows.forEach(r => totalInstallmentsPaid += Number(r.amount));

    const totalAmount = Number(booking.total_amount) || 0;
    const partialAmount = Number(booking.partial_amount) || 0;
    const newPending = totalAmount - (partialAmount + totalInstallmentsPaid);

    if (booking.payment_status === 'Paid' && newPending > 0) {
      await db.execute({ sql: "UPDATE bookings SET payment_status = 'Pending' WHERE id = ?", args: [id] });
      return res.json({ message: 'Installment deleted', paymentStatusUpdated: true, newStatus: 'Pending' });
    }

    res.json({ message: 'Installment deleted', paymentStatusUpdated: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
