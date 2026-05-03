import { db } from '../db/client.js';
import fs from 'fs';
import path from 'path';

export const getBookings = async (req, res) => {
  const { status, payment, date, filter, type, search } = req.query;
  
  let sql = `
    SELECT b.*, 
      (SELECT json_group_array(json_object('id', bp.id, 'file_url', bp.file_url)) 
       FROM booking_photos bp WHERE bp.booking_id = b.id) as photos
    FROM bookings b
    WHERE 1=1
  `;
  const args = [];

  if (status) {
    sql += ` AND b.booking_status = ?`;
    args.push(status);
  }
  if (payment) {
    sql += ` AND b.payment_status = ?`;
    args.push(payment);
  }
  if (date === 'today') {
    sql += ` AND b.delivery_date = date('now', 'localtime')`;
  }
  if (filter === 'upcoming') {
    sql += ` AND b.delivery_date > date('now', 'localtime') AND b.booking_status != 'Completed'`;
  }
  if (filter === 'monthly') {
    sql += ` AND strftime('%Y-%m', b.delivery_date) = strftime('%Y-%m', 'now', 'localtime')`;
  }
  if (type) {
    sql += ` AND b.customer_type_id = ?`;
    args.push(type);
  }
  if (search) {
    sql += ` AND (b.customer_name LIKE ? OR b.phone LIKE ?)`;
    args.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY b.delivery_date ASC`;

  try {
    const result = await db.execute({ sql, args });
    
    // Parse the JSON string from sqlite json_group_array back to objects
    const rows = result.rows.map(row => ({
      ...row,
      photos: row.photos && row.photos !== '[{}]' ? JSON.parse(row.photos).filter(p => p.id !== null) : []
    }));
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const bResult = await db.execute({
      sql: 'SELECT * FROM bookings WHERE id = ?',
      args: [id]
    });
    
    if (bResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const pResult = await db.execute({
      sql: 'SELECT * FROM booking_photos WHERE booking_id = ?',
      args: [id]
    });

    res.json({
      ...bResult.rows[0],
      photos: pResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBooking = async (req, res) => {
  const { 
    customer_name, phone, place, booking_date, delivery_date, delivery_time, 
    return_date, return_time, function_type_id, total_amount, delivery_amount, 
    discount_amount, partial_amount, sub_total, payment_method, payment_status, 
    booking_status, customer_type_id, notes,
    is_returned, damage_amount, damage_notes
  } = req.body;

  if (!customer_name || !phone || !total_amount || !delivery_date || !booking_status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanNum = (val) => val === '' || val === undefined || val === null ? null : Number(val);
  const generateBookingUid = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    // 1. Upsert Customer
    const custCheck = await db.execute({
      sql: 'SELECT id FROM customers WHERE phone = ?',
      args: [phone]
    });

    if (custCheck.rows.length > 0) {
      if (customer_type_id) {
        await db.execute({
          sql: 'UPDATE customers SET type_id = ? WHERE phone = ?',
          args: [customer_type_id, phone]
        });
      }
    } else {
      await db.execute({
        sql: 'INSERT INTO customers (name, phone, address, type_id) VALUES (?, ?, ?, ?)',
        args: [customer_name, phone, place || null, customer_type_id || null]
      });
    }

    // 2. Insert Booking
    const result = await db.execute({
      sql: `INSERT INTO bookings (
        customer_name, phone, place, booking_date, delivery_date, delivery_time,
        return_date, return_time, function_type_id, total_amount, delivery_amount,
        discount_amount, partial_amount, sub_total, payment_method, payment_status,
        booking_status, customer_type_id, notes,
        is_returned, damage_amount, damage_notes, booking_uid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        customer_name, phone, place || null, booking_date || null, delivery_date, delivery_time || null,
        return_date || null, return_time || null, function_type_id || null, 
        cleanNum(total_amount), cleanNum(delivery_amount), cleanNum(discount_amount), 
        cleanNum(partial_amount), cleanNum(sub_total), payment_method || null, 
        payment_status || 'Pending', booking_status, customer_type_id || null, notes || null,
        is_returned || 0, cleanNum(damage_amount) || 0, damage_notes || null,
        generateBookingUid()
      ]
    });

    res.status(201).json({ id: result.rows[0].id, message: 'Booking created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { 
    customer_name, phone, place, booking_date, delivery_date, delivery_time, 
    return_date, return_time, function_type_id, total_amount, delivery_amount, 
    discount_amount, partial_amount, sub_total, payment_method, payment_status, 
    booking_status, customer_type_id, notes,
    is_returned, damage_amount, damage_notes
  } = req.body;

  const cleanNum = (val) => val === '' || val === undefined || val === null ? null : Number(val);

  try {
    await db.execute({
      sql: `UPDATE bookings SET 
        customer_name=?, phone=?, place=?, booking_date=?, delivery_date=?, delivery_time=?,
        return_date=?, return_time=?, function_type_id=?, total_amount=?, delivery_amount=?,
        discount_amount=?, partial_amount=?, sub_total=?, payment_method=?, payment_status=?,
        booking_status=?, customer_type_id=?, notes=?,
        is_returned=?, damage_amount=?, damage_notes=?
        WHERE id=?`,
      args: [
        customer_name, phone, place || null, booking_date || null, delivery_date, delivery_time || null,
        return_date || null, return_time || null, function_type_id || null, 
        cleanNum(total_amount), cleanNum(delivery_amount), cleanNum(discount_amount), 
        cleanNum(partial_amount), cleanNum(sub_total), payment_method || null, 
        payment_status || 'Pending', booking_status, customer_type_id || null, notes || null,
        is_returned || 0, cleanNum(damage_amount) || 0, damage_notes || null,
        id
      ]
    });

    res.json({ message: 'Booking updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete files first
    const photos = await db.execute({
      sql: 'SELECT file_url FROM booking_photos WHERE booking_id = ?',
      args: [id]
    });

    photos.rows.forEach(p => {
      const filePath = path.join(process.cwd(), p.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // Delete from DB (cascade handles booking_photos if configured, but manual ensures clean)
    await db.execute({ sql: 'DELETE FROM booking_photos WHERE booking_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM bookings WHERE id = ?', args: [id] });

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { booking_status } = req.body;
  
  try {
    await db.execute({
      sql: 'UPDATE bookings SET booking_status = ? WHERE id = ?',
      args: [booking_status, id]
    });
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReturnStatus = async (req, res) => {
  const { id } = req.params;
  const { is_returned, damage_amount, damage_notes } = req.body;
  
  const cleanNum = (val) => val === '' || val === undefined || val === null ? null : Number(val);

  try {
    await db.execute({
      sql: 'UPDATE bookings SET is_returned = ?, damage_amount = ?, damage_notes = ? WHERE id = ?',
      args: [is_returned ? 1 : 0, cleanNum(damage_amount) || 0, damage_notes || null, id]
    });
    res.json({ message: 'Return status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;
  
  try {
    await db.execute({
      sql: 'UPDATE bookings SET payment_status = ? WHERE id = ?',
      args: [payment_status, id]
    });
    res.json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadPhotos = async (req, res) => {
  const { id } = req.params;
  const files = req.files;
  
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

  try {
    const results = [];
    for (const file of files) {
      const url = `/uploads/${file.filename}`;
      const insert = await db.execute({
        sql: 'INSERT INTO booking_photos (booking_id, file_url) VALUES (?, ?) RETURNING id',
        args: [id, url]
      });
      results.push({ id: insert.rows[0].id, file_url: url });
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePhoto = async (req, res) => {
  const { id, photoId } = req.params;
  
  try {
    const photo = await db.execute({
      sql: 'SELECT file_url FROM booking_photos WHERE id = ? AND booking_id = ?',
      args: [photoId, id]
    });

    if (photo.rows.length > 0) {
      const filePath = path.join(process.cwd(), photo.rows[0].file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      await db.execute({
        sql: 'DELETE FROM booking_photos WHERE id = ?',
        args: [photoId]
      });
    }
    
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
