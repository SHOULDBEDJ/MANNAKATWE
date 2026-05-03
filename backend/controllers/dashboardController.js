import { db } from '../db/client.js';

export const getKpis = async (req, res) => {
  try {
    const kpis = {
      total_bookings: 0,
      todays_deliveries: 0,
      upcoming_deliveries: 0,
      pending_payments: 0,
      total_revenue: 0,
      pending_amount: 0,
      total_expenses: 0,
      monthly_revenue: 0
    };
    
    const queries = [
      db.execute('SELECT COUNT(*) as count FROM bookings'),
      db.execute("SELECT COUNT(*) as count FROM bookings WHERE delivery_date = date('now', 'localtime')"),
      db.execute("SELECT COUNT(*) as count FROM bookings WHERE delivery_date > date('now', 'localtime') AND booking_status != 'Completed'"),
      db.execute("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'Pending'"),
      db.execute("SELECT SUM(total_amount) as sum FROM bookings WHERE booking_status = 'Completed'"),
      db.execute("SELECT SUM(total_amount - COALESCE(partial_amount,0)) as sum FROM bookings WHERE payment_status = 'Pending'"),
      db.execute('SELECT SUM(amount) as sum FROM expenses'),
      db.execute("SELECT SUM(total_amount) as sum FROM bookings WHERE strftime('%Y-%m', delivery_date) = strftime('%Y-%m', 'now', 'localtime') AND booking_status = 'Completed'")
    ];
    
    const results = await Promise.all(queries);
    
    kpis.total_bookings = results[0].rows[0].count || 0;
    kpis.todays_deliveries = results[1].rows[0].count || 0;
    kpis.upcoming_deliveries = results[2].rows[0].count || 0;
    kpis.pending_payments = results[3].rows[0].count || 0;
    kpis.total_revenue = results[4].rows[0].sum || 0;
    kpis.pending_amount = results[5].rows[0].sum || 0;
    kpis.total_expenses = results[6].rows[0].sum || 0;
    kpis.monthly_revenue = results[7].rows[0].sum || 0;

    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCalendar = async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'Year and month required' });
  const paddedMonth = month.toString().padStart(2, '0');
  try {
    const result = await db.execute({
      sql: `SELECT delivery_date, COUNT(*) as count FROM bookings WHERE strftime('%Y-%m', delivery_date) = ? GROUP BY delivery_date`,
      args: [`${year}-${paddedMonth}`]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingsByDate = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date required' });
  try {
    const result = await db.execute({
      sql: `SELECT id, customer_name, delivery_time, booking_status, payment_status, total_amount FROM bookings WHERE delivery_date = ? ORDER BY delivery_time ASC`,
      args: [date]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOverdue = async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM bookings WHERE delivery_date < date('now', 'localtime') AND booking_status = 'Confirmed'");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markOverdueDelivered = async (req, res) => {
  try {
    const check = await db.execute("SELECT COUNT(*) as count FROM bookings WHERE delivery_date < date('now', 'localtime') AND booking_status = 'Confirmed'");
    const count = check.rows[0].count || 0;
    
    if (count > 0) {
      await db.execute("UPDATE bookings SET booking_status = 'Delivered' WHERE delivery_date < date('now', 'localtime') AND booking_status = 'Confirmed'");
    }
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecent = async (req, res) => {
  try {
    const result = await db.execute("SELECT id, customer_name, delivery_date, booking_status, payment_status, total_amount FROM bookings ORDER BY created_at DESC LIMIT 10");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
