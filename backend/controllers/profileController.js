import { db } from '../db/client.js';

export const getProfile = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM profile LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({});
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { business_name, phone, alt_phone, address, photo_url } = req.body;
  
  try {
    const existing = await db.execute('SELECT id FROM profile LIMIT 1');
    
    if (existing.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO profile (business_name, phone, alt_phone, address, photo_url) VALUES (?, ?, ?, ?, ?)',
        args: [business_name, phone, alt_phone, address, photo_url]
      });
    } else {
      await db.execute({
        sql: 'UPDATE profile SET business_name = ?, phone = ?, alt_phone = ?, address = ?, photo_url = ? WHERE id = ?',
        args: [business_name, phone, alt_phone, address, photo_url, existing.rows[0].id]
      });
    }
    res.json({ message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
};
