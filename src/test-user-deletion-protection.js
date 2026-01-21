const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Testing User Deletion Protection ===\n');

// Test 1: Check for users with non-archived reservations
db.all(
  `SELECT
    u.id,
    u.name,
    u.email,
    COUNT(CASE WHEN r.status != 'archived' THEN 1 END) as visible_reservations,
    COUNT(CASE WHEN r.status = 'archived' THEN 1 END) as archived_reservations,
    GROUP_CONCAT(DISTINCT r.status) as all_statuses
  FROM users u
  LEFT JOIN reservations r ON u.id = r.user_id
  GROUP BY u.id
  ORDER BY visible_reservations DESC`,
  [],
  (err, users) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    console.log('USER DELETION ELIGIBILITY:\n');
    console.log('─'.repeat(80));

    users.forEach(user => {
      const canDelete = user.visible_reservations === 0;
      const status = canDelete ? '✓ CAN DELETE' : '✗ CANNOT DELETE';

      console.log(`User ID ${user.id}: ${user.name} (${user.email})`);
      console.log(`  ${status}`);
      console.log(`  Visible Reservations: ${user.visible_reservations}`);
      console.log(`  Archived Reservations: ${user.archived_reservations}`);
      if (user.all_statuses) {
        console.log(`  Reservation Statuses: ${user.all_statuses}`);
      }
      console.log('─'.repeat(80));
    });

    // Test 2: Show specific reservation details for users with visible reservations
    console.log('\nDETAILED RESERVATION BREAKDOWN:\n');

    db.all(
      `SELECT
        u.id as user_id,
        u.name,
        r.id as reservation_id,
        r.status,
        r.start_date,
        r.end_date,
        t.name as tool_name
      FROM users u
      INNER JOIN reservations r ON u.id = r.user_id
      INNER JOIN tools t ON r.tool_id = t.id
      WHERE r.status != 'archived'
      ORDER BY u.id, r.start_date`,
      [],
      (err, reservations) => {
        if (err) {
          console.error('Error:', err);
          db.close();
          return;
        }

        if (reservations.length === 0) {
          console.log('No users have visible (non-archived) reservations.');
          console.log('All users can be deleted if needed.');
        } else {
          console.log('USERS WITH VISIBLE RESERVATIONS (Cannot be deleted):');
          console.log('─'.repeat(80));

          let currentUserId = null;
          reservations.forEach(res => {
            if (res.user_id !== currentUserId) {
              if (currentUserId !== null) console.log('');
              console.log(`User: ${res.name} (ID: ${res.user_id})`);
              currentUserId = res.user_id;
            }
            console.log(`  • Reservation #${res.reservation_id}: ${res.tool_name}`);
            console.log(`    Status: ${res.status.toUpperCase()}`);
            console.log(`    Dates: ${res.start_date} to ${res.end_date}`);
          });
        }

        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY:');
        console.log('Users can only be deleted if ALL their reservations are archived.');
        console.log('Any reservation with status: active, pending, delivered, returned,');
        console.log('cancelled, or overdue will prevent deletion.');
        console.log('='.repeat(80) + '\n');

        db.close();
      }
    );
  }
);
