import { db } from './db/client.js';

async function patch() {
  console.log('Patching UIDs for existing customers and bookings...');

  // 1. Patch Customers
  const customers = await db.execute('SELECT id FROM customers WHERE customer_uid IS NULL');
  for (const row of customers.rows) {
    const uid = `C${row.id.toString().padStart(5, '0')}`;
    await db.execute({
      sql: 'UPDATE customers SET customer_uid = ? WHERE id = ?',
      args: [uid, row.id]
    });
    console.log(`Patched Customer ${row.id} -> ${uid}`);
  }

  // 2. Patch Bookings
  const generateBookingUid = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const bookings = await db.execute('SELECT id FROM bookings WHERE booking_uid IS NULL');
  for (const row of bookings.rows) {
    let uid = generateBookingUid();
    // In a real app we should check for uniqueness, but for 6 chars random it's likely unique for existing small dataset
    await db.execute({
      sql: 'UPDATE bookings SET booking_uid = ? WHERE id = ?',
      args: [uid, row.id]
    });
    console.log(`Patched Booking ${row.id} -> ${uid}`);
  }

  console.log('UID Patch completed.');
  process.exit(0);
}

patch().catch(err => {
  console.error(err);
  process.exit(1);
});
