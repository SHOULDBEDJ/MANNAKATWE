import { db } from '../db/client.js';

export const getCustomerHistory = async (req, res) => {
  const { search, date } = req.query;
  try {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const args = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR customer_uid LIKE ?)';
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (date) {
      // Find customers who had bookings on this date by matching phone numbers
      sql += ` AND phone IN (SELECT DISTINCT phone FROM bookings WHERE booking_date = ? OR delivery_date = ?)`;
      args.push(date, date);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';
    
    const result = await db.execute({ sql, args });
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerBookings = async (req, res) => {
  const { id } = req.params; // customer table ID or UID? I'll use phone number or table ID
  // Since we might have multiple "entries" for the same customer phone in bookings, 
  // but we are tracking by customer table.
  try {
    const cust = await db.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
    if (cust.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    
    const phone = cust.rows[0].phone;
    
    const result = await db.execute({
      sql: 'SELECT * FROM bookings WHERE phone = ? ORDER BY delivery_date DESC',
      args: [phone]
    });
    res.json({
      customer: cust.rows[0],
      bookings: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
