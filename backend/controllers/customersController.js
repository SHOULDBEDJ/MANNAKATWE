import { db } from '../db/client.js';

export const getCustomers = async (req, res) => {
  const { phone, search } = req.query;
  
  try {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const args = [];
    
    if (phone) {
      sql += ' AND phone = ?';
      args.push(phone);
    }
    
    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE id = ?',
      args: [id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCustomer = async (req, res) => {
  const { name, phone, alt_phone, address, type_id, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  try {
    // Generate customer_uid: C + next ID
    const countRes = await db.execute('SELECT MAX(id) as maxId FROM customers');
    const nextId = (countRes.rows[0].maxId || 0) + 1;
    const customer_uid = `C${nextId.toString().padStart(5, '0')}`;

    const result = await db.execute({
      sql: 'INSERT INTO customers (name, phone, alt_phone, address, type_id, notes, customer_uid) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [name, phone, alt_phone || null, address || null, type_id || null, notes || null, customer_uid]
    });
    res.status(201).json({ id: result.rows[0]?.id || null, uid: customer_uid, message: 'Customer created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, alt_phone, address, type_id, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  try {
    await db.execute({
      sql: 'UPDATE customers SET name=?, phone=?, alt_phone=?, address=?, type_id=?, notes=? WHERE id=?',
      args: [name, phone, alt_phone || null, address || null, type_id || null, notes || null, id]
    });
    res.json({ message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
