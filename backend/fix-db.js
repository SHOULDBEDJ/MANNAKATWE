import { db } from './db/client.js';

async function fix() {
  console.log('Checking for missing columns...');
  
  const columnsToAdd = [
    { name: 'is_returned', type: 'INTEGER DEFAULT 0' },
    { name: 'damage_amount', type: 'REAL DEFAULT 0' },
    { name: 'damage_notes', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      await db.execute(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column: ${col.name}`);
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.error(`Error adding ${col.name}:`, err.message);
      }
    }
  }

  console.log('Database fix completed.');
  process.exit(0);
}

fix();
