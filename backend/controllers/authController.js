import { db } from '../db/client.js';

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ? AND password = ?',
      args: [username, password]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    // In a real app, use JWT. Here we just return user info.
    res.json({
      id: user.id,
      username: user.username,
      permissions: user.permissions === 'all' ? 'all' : JSON.parse(user.permissions || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
