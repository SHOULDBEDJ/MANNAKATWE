import { db } from '../db/client.js';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';

// KPI CONFIG
export const getKpiConfig = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM kpi_config ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateKpiConfig = async (req, res) => {
  const configs = req.body; // Array of {id, is_visible, display_order}
  try {
    for (const config of configs) {
      await db.execute({
        sql: 'UPDATE kpi_config SET is_visible = ?, display_order = ? WHERE id = ?',
        args: [config.is_visible ? 1 : 0, config.display_order, config.id]
      });
    }
    res.json({ message: 'KPI configuration updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DATA MANAGEMENT
export const backupData = async (req, res) => {
  try {
    const tables = [
      'customer_types', 'upi_ids', 'function_types', 'profile',
      'customers', 'bookings', 'booking_photos', 'installments',
      'expense_types', 'expenses', 'gallery_albums', 'gallery_media', 'kpi_config'
    ];
    
    const data = {};
    for (const table of tables) {
      const result = await db.execute(`SELECT * FROM ${table}`);
      data[table] = result.rows;
    }
    
    const tempDir = path.join(process.cwd(), 'temp_backup');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const dataPath = path.join(tempDir, 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    res.attachment('sss-backup.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => res.status(500).send({ error: err.message }));
    archive.pipe(res);
    
    archive.file(dataPath, { name: 'data.json' });
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }
    
    await archive.finalize();
    
    // Cleanup
    fs.unlinkSync(dataPath);
    fs.rmdirSync(tempDir);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreData = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No backup file provided' });
  
  const zipPath = req.file.path;
  const extractDir = path.join(process.cwd(), 'temp_restore');
  
  try {
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir);
    
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();
      
    const dataPath = path.join(extractDir, 'data.json');
    if (!fs.existsSync(dataPath)) throw new Error('data.json not found in backup');
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // DELETE ALL in correct FK order
    const tablesToDelete = [
      'installments', 'booking_photos', 'expenses', 'gallery_media',
      'gallery_albums', 'bookings', 'customers', 'function_types', 
      'expense_types', 'upi_ids', 'customer_types', 'profile', 'kpi_config'
    ];
    
    for (const table of tablesToDelete) {
      await db.execute(`DELETE FROM ${table}`);
    }
    
    // RESTORE DATA
    for (const table in data) {
      const rows = data[table];
      if (rows.length === 0) continue;
      
      const columns = Object.keys(rows[0]).join(', ');
      const placeholders = Object.keys(rows[0]).map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      
      for (const row of rows) {
        await db.execute({ sql, args: Object.values(row) });
      }
    }
    
    // RESTORE FILES
    const backupUploads = path.join(extractDir, 'uploads');
    const targetUploads = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(backupUploads)) {
      if (!fs.existsSync(targetUploads)) fs.mkdirSync(targetUploads);
      const files = fs.readdirSync(backupUploads);
      for (const file of files) {
        fs.copyFileSync(path.join(backupUploads, file), path.join(targetUploads, file));
      }
    }
    
    res.json({ message: 'Data restored successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup
    if (fs.existsSync(extractDir)) {
      const files = fs.readdirSync(extractDir);
      // Recurse delete if needed or just simple
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
};

export const deleteAllData = async (req, res) => {
  try {
    const tablesToDelete = [
      'installments', 'booking_photos', 'expenses', 'gallery_media',
      'gallery_albums', 'bookings', 'customers', 'function_types', 
      'expense_types', 'upi_ids', 'customer_types', 'profile', 'kpi_config'
    ];
    
    for (const table of tablesToDelete) {
      await db.execute(`DELETE FROM ${table}`);
    }
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
    
    // RE-SEED DEFAULTS
    await db.execute("INSERT INTO customer_types (name) VALUES ('Regular Chief'), ('Other Business Owner')");
    
    const defaultKpis = [
      ['total_bookings', 1, 1],
      ['todays_deliveries', 1, 2],
      ['upcoming_deliveries', 1, 3],
      ['pending_payments', 1, 4],
      ['total_revenue', 1, 5],
      ['pending_amount', 1, 6],
      ['total_expenses', 1, 7],
      ['monthly_revenue', 1, 8],
      ['monthly_expenses', 1, 9]
    ];
    for (const [key, visible, order] of defaultKpis) {
      await db.execute({
        sql: 'INSERT INTO kpi_config (kpi_key, is_visible, display_order) VALUES (?, ?, ?)',
        args: [key, visible, order]
      });
    }
    
    res.json({ message: 'All data deleted and reset to defaults' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
