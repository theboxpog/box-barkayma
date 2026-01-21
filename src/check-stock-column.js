const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('Checking for stock column...\n');

db.all('PRAGMA table_info(tools)', [], (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Tools table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  const hasStockColumn = columns.some(col => col.name === 'stock');

  if (hasStockColumn) {
    console.log('\n✅ Stock column exists!');

    // Show current stock values
    db.all('SELECT id, name, stock FROM tools', [], (err, tools) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('\nCurrent stock values:');
        tools.forEach(tool => {
          console.log(`  ${tool.name}: ${tool.stock || 0} units`);
        });
      }
      db.close();
    });
  } else {
    console.log('\n❌ Stock column does NOT exist!');
    console.log('Run: node add-stock-column.js');
    db.close();
  }
});
