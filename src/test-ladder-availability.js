const db = require('./database');

const toolId = 3; // Ladder
const stock = 1;

// Test different date ranges
const testCases = [
  { start: '2025-12-20', end: '2025-12-21', label: 'Dec 20-21 (overlaps)' },
  { start: '2025-12-21', end: '2025-12-22', label: 'Dec 21-22 (exact match)' },
  { start: '2025-12-22', end: '2025-12-23', label: 'Dec 22-23 (overlaps end)' },
  { start: '2025-12-23', end: '2025-12-24', label: 'Dec 23-24 (no overlap)' },
  { start: '2025-12-19', end: '2025-12-20', label: 'Dec 19-20 (no overlap)' }
];

const today = new Date().toISOString().split('T')[0];
console.log('Today:', today);
console.log('\n');

db.all(
  `SELECT quantity, status, start_date, end_date FROM reservations
   WHERE tool_id = ?
   AND (status = 'active' OR status = 'delivered' OR status = 'overdue')`,
  [toolId],
  (err, allReservations) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }

    console.log('Active reservations:', allReservations);
    console.log('\n');

    testCases.forEach(test => {
      const { start, end, label } = test;

      const reservedQuantity = allReservations.reduce((sum, r) => {
        if (r.status === 'active') {
          // Active reservations: check normal date overlap
          if (r.start_date <= end && r.end_date >= start) {
            console.log(`  ${label}: Overlaps with reservation (${r.start_date} to ${r.end_date})`);
            return sum + (r.quantity || 1);
          }
        }
        return sum;
      }, 0);

      const availableStock = stock - reservedQuantity;
      const available = availableStock >= 1;

      console.log(`${label}:`);
      console.log(`  Reserved: ${reservedQuantity}, Available: ${availableStock}, Can book: ${available}`);
      console.log('');
    });

    process.exit(0);
  }
);
