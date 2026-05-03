import { db } from '../db/client.js';

export const getAll = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM upi_ids ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  const { label, upi_id } = req.body;
  if (!label || !upi_id) {
    return res.status(400).json({ error: 'Label and UPI ID are required' });
  }

  try {
    await db.execute({
      sql: 'INSERT INTO upi_ids (label, upi_id) VALUES (?, ?)',
      args: [label, upi_id]
    });
    res.status(201).json({ message: 'UPI ID created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { label, upi_id } = req.body;
  if (!label || !upi_id) {
    return res.status(400).json({ error: 'Label and UPI ID are required' });
  }

  try {
    await db.execute({
      sql: 'UPDATE upi_ids SET label = ?, upi_id = ? WHERE id = ?',
      args: [label, upi_id, id]
    });
    res.json({ message: 'UPI ID updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute({
      sql: 'DELETE FROM upi_ids WHERE id = ?',
      args: [id]
    });
    res.json({ message: 'UPI ID deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
