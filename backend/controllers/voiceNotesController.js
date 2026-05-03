import { db } from '../db/client.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads/voice_notes');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}.webm`);
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max
});

// GET /api/bookings/:id/voice-notes
export const getVoiceNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: `SELECT * FROM booking_voice_notes WHERE booking_id = ? ORDER BY created_at DESC`,
      args: [id]
    });
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/bookings/:id/voice-notes
export const addVoiceNote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No audio file received' });

    const fileUrl = `/uploads/voice_notes/${req.file.filename}`;
    const result = await db.execute({
      sql: `INSERT INTO booking_voice_notes (booking_id, file_url) VALUES (?, ?) RETURNING *`,
      args: [id, fileUrl]
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/bookings/:id/voice-notes/:noteId
export const deleteVoiceNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const noteResult = await db.execute({
      sql: `SELECT file_url FROM booking_voice_notes WHERE id = ?`,
      args: [noteId]
    });

    if (noteResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const fileUrl = noteResult.rows[0].file_url;
    const filePath = path.join(__dirname, '..', fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.execute({ sql: `DELETE FROM booking_voice_notes WHERE id = ?`, args: [noteId] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
