import { db } from '../db/client.js';
import fs from 'fs';
import path from 'path';

export const getExpenses = async (req, res) => {
  try {
    const sql = `
      SELECT e.*, et.name as expense_type_name, b.customer_name as linked_booking_name
      FROM expenses e
      LEFT JOIN expense_types et ON e.expense_type_id = et.id
      LEFT JOIN bookings b ON e.booking_id = b.id
      ORDER BY e.expense_date DESC
    `;
    const result = await db.execute(sql);
    
    let total = 0;
    result.rows.forEach(r => {
      total += Number(r.amount) || 0;
    });

    res.json({ data: result.rows, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM expenses WHERE id = ?',
      args: [id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpense = async (req, res) => {
  const { expense_type_id, amount, expense_date, booking_id, notes } = req.body;
  if (!expense_type_id || !amount) return res.status(400).json({ error: 'Type and amount required' });

  const cleanNum = (val) => val === '' || val === undefined ? null : Number(val);

  try {
    const result = await db.execute({
      sql: 'INSERT INTO expenses (expense_type_id, amount, expense_date, booking_id, notes) VALUES (?, ?, ?, ?, ?) RETURNING id',
      args: [
        expense_type_id, 
        cleanNum(amount), 
        expense_date || new Date().toISOString(), 
        booking_id || null, 
        notes || null
      ]
    });
    res.status(201).json({ id: result.rows[0].id, message: 'Expense created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { expense_type_id, amount, expense_date, booking_id, notes } = req.body;
  if (!expense_type_id || !amount) return res.status(400).json({ error: 'Type and amount required' });

  const cleanNum = (val) => val === '' || val === undefined ? null : Number(val);

  try {
    await db.execute({
      sql: 'UPDATE expenses SET expense_type_id=?, amount=?, expense_date=?, booking_id=?, notes=? WHERE id=?',
      args: [
        expense_type_id, 
        cleanNum(amount), 
        expense_date || new Date().toISOString(), 
        booking_id || null, 
        notes || null, 
        id
      ]
    });
    res.json({ message: 'Expense updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await db.execute({ sql: 'SELECT photo_url FROM expenses WHERE id = ?', args: [id] });
    
    if (expense.rows.length > 0 && expense.rows[0].photo_url) {
      const filePath = path.join(process.cwd(), expense.rows[0].photo_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [id] });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadExpensePhoto = async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const url = `/uploads/${file.filename}`;
    
    // Check if replacing existing photo
    const existing = await db.execute({ sql: 'SELECT photo_url FROM expenses WHERE id = ?', args: [id] });
    if (existing.rows.length > 0 && existing.rows[0].photo_url) {
      const oldPath = path.join(process.cwd(), existing.rows[0].photo_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.execute({
      sql: 'UPDATE expenses SET photo_url = ? WHERE id = ?',
      args: [url, id]
    });
    res.json({ file_url: url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
