import { db } from '../db/client.js';
import fs from 'fs';
import path from 'path';

// ALBUMS
export const getAlbums = async (req, res) => {
  try {
    const albums = await db.execute('SELECT * FROM gallery_albums ORDER BY created_at DESC');
    
    const data = await Promise.all(albums.rows.map(async (album) => {
      const media = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM gallery_media WHERE album_id = ?',
        args: [album.id]
      });
      return {
        ...album,
        media_count: media.rows[0].count
      };
    }));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAlbum = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Album name required' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO gallery_albums (name) VALUES (?) RETURNING *',
      args: [name]
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAlbum = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE gallery_albums SET name = ? WHERE id = ?',
      args: [name, id]
    });
    res.json({ message: 'Album updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAlbum = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await db.execute({
      sql: 'SELECT file_url FROM gallery_media WHERE album_id = ?',
      args: [id]
    });
    
    media.rows.forEach(m => {
      const filePath = path.join(process.cwd(), m.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    
    await db.execute({ sql: 'DELETE FROM gallery_media WHERE album_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM gallery_albums WHERE id = ?', args: [id] });
    
    res.json({ message: 'Album deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MEDIA
export const getAlbumMedia = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM gallery_media WHERE album_id = ? ORDER BY created_at ASC',
      args: [id]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadMedia = async (req, res) => {
  const { id } = req.params;
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  
  try {
    const inserted = [];
    for (const file of files) {
      const media_type = file.mimetype.startsWith('video/') ? 'video' : 'image';
      const file_url = `/uploads/${file.filename}`;
      
      const result = await db.execute({
        sql: 'INSERT INTO gallery_media (album_id, file_url, media_type) VALUES (?, ?, ?) RETURNING *',
        args: [id, file_url, media_type]
      });
      inserted.push(result.rows[0]);
    }
    
    // Set cover_url if not set
    const album = await db.execute({ sql: 'SELECT cover_url FROM gallery_albums WHERE id = ?', args: [id] });
    if (!album.rows[0]?.cover_url && inserted.length > 0) {
      await db.execute({
        sql: 'UPDATE gallery_albums SET cover_url = ? WHERE id = ?',
        args: [inserted[0].file_url, id]
      });
    }
    
    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await db.execute({ sql: 'SELECT * FROM gallery_media WHERE id = ?', args: [id] });
    if (media.rows.length === 0) return res.status(404).json({ error: 'Media not found' });
    
    const item = media.rows[0];
    const filePath = path.join(process.cwd(), item.file_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    await db.execute({ sql: 'DELETE FROM gallery_media WHERE id = ?', args: [id] });
    
    // Check if we need to update cover_url
    const album = await db.execute({ sql: 'SELECT cover_url FROM gallery_albums WHERE id = ?', args: [item.album_id] });
    if (album.rows[0]?.cover_url === item.file_url) {
      const nextMedia = await db.execute({
        sql: 'SELECT file_url FROM gallery_media WHERE album_id = ? LIMIT 1',
        args: [item.album_id]
      });
      const nextUrl = nextMedia.rows.length > 0 ? nextMedia.rows[0].file_url : null;
      await db.execute({
        sql: 'UPDATE gallery_albums SET cover_url = ? WHERE id = ?',
        args: [nextUrl, item.album_id]
      });
    }
    
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
