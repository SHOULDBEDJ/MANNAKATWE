import { db } from '../db/client.js';

export const getAll = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM function_types ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    await db.execute({
      sql: 'INSERT INTO function_types (name) VALUES (?)',
      args: [name]
    });
    res.status(201).json({ message: 'Function type created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    await db.execute({
      sql: 'UPDATE function_types SET name = ? WHERE id = ?',
      args: [name, id]
    });
    res.json({ message: 'Function type updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM bookings WHERE function_type_id = ?',
      args: [id]
    });

    if (check.rows[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete: bookings are using this function type.' });
    }

    await db.execute({
      sql: 'DELETE FROM function_types WHERE id = ?',
      args: [id]
    });
    res.json({ message: 'Function type deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
