import { db } from '../db/client.js';

export const getUsers = async (req, res) => {
  try {
    const result = await db.execute('SELECT id, username, permissions, created_at FROM users');
    res.json(result.rows.map(row => ({
      ...row,
      permissions: row.permissions === 'all' ? 'all' : JSON.parse(row.permissions || '[]')
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  const { username, password, permissions } = req.body;
  try {
    await db.execute({
      sql: 'INSERT INTO users (username, password, permissions) VALUES (?, ?, ?)',
      args: [username, password, JSON.stringify(permissions)]
    });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, permissions } = req.body;
  try {
    let sql = 'UPDATE users SET username = ?, permissions = ?';
    let args = [username, JSON.stringify(permissions)];
    
    if (password) {
      sql += ', password = ?';
      args.push(password);
    }
    
    sql += ' WHERE id = ?';
    args.push(id);

    await db.execute({ sql, args });
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.execute({ sql: 'SELECT username FROM users WHERE id = ?', args: [id] });
    if (user.rows[0]?.username === 'manna123') {
      return res.status(403).json({ error: 'Default admin cannot be deleted' });
    }
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
