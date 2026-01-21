const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

const tools = [
  // Power Tools (10)
  { name: 'Cordless Impact Driver', category: 'Power Tools', price: 18, desc: 'High-torque impact driver for heavy-duty fastening', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400' },
  { name: 'Angle Grinder 9-inch', category: 'Power Tools', price: 25, desc: 'Powerful angle grinder for cutting and grinding metal', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Belt Sander', category: 'Power Tools', price: 22, desc: 'Professional belt sander for smooth finishing', img: 'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=400' },
  { name: 'Rotary Hammer Drill', category: 'Power Tools', price: 35, desc: 'Heavy-duty rotary hammer for concrete and masonry', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400' },
  { name: 'Reciprocating Saw', category: 'Power Tools', price: 28, desc: 'Versatile reciprocating saw for demolition work', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400' },
  { name: 'Heat Gun', category: 'Power Tools', price: 15, desc: 'Variable temperature heat gun for stripping and shrinking', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { name: 'Biscuit Joiner', category: 'Power Tools', price: 30, desc: 'Precision biscuit joiner for woodworking projects', img: 'https://images.unsplash.com/photo-1586864387634-bcc2a0b657e6?w=400' },
  { name: 'Brad Nailer', category: 'Power Tools', price: 20, desc: 'Pneumatic brad nailer for trim work', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400' },
  { name: 'Drywall Screw Gun', category: 'Power Tools', price: 16, desc: 'Auto-feed screw gun for drywall installation', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Plate Compactor', category: 'Power Tools', price: 45, desc: 'Gas-powered plate compactor for soil compaction', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },

  // Hand Tools (10)
  { name: 'Tool Set 200-Piece', category: 'Hand Tools', price: 12, desc: 'Complete mechanic tool set with case', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400' },
  { name: 'Pipe Wrench Set', category: 'Hand Tools', price: 10, desc: 'Heavy-duty pipe wrench set (10", 14", 18")', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Bolt Cutter 36-inch', category: 'Hand Tools', price: 14, desc: 'Heavy-duty bolt cutter for cutting chains and bolts', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400' },
  { name: 'Crowbar Set', category: 'Hand Tools', price: 8, desc: 'Pry bar and wrecking bar set', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400' },
  { name: 'Wood Chisel Set', category: 'Hand Tools', price: 11, desc: 'Professional wood chisel set (6 pieces)', img: 'https://images.unsplash.com/photo-1586864387634-bcc2a0b657e6?w=400' },
  { name: 'Hand Saw Collection', category: 'Hand Tools', price: 9, desc: 'Variety of hand saws for different materials', img: 'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=400' },
  { name: 'C-Clamp Set', category: 'Hand Tools', price: 7, desc: 'Various sizes C-clamps for holding work', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Measuring Wheel', category: 'Hand Tools', price: 13, desc: 'Long-distance measuring wheel with counter', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Stud Finder Pro', category: 'Hand Tools', price: 6, desc: 'Electronic stud finder with deep scan', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400' },
  { name: 'Tap and Die Set', category: 'Hand Tools', price: 18, desc: 'Complete metric and SAE tap and die set', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400' },

  // Garden Tools (10)
  { name: 'Hedge Trimmer Electric', category: 'Garden Tools', price: 20, desc: 'Corded hedge trimmer with 24-inch blade', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' },
  { name: 'Leaf Blower Gas', category: 'Garden Tools', price: 28, desc: 'Powerful gas-powered leaf blower', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  { name: 'Pressure Washer 3000 PSI', category: 'Garden Tools', price: 40, desc: 'Gas pressure washer with multiple nozzles', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400' },
  { name: 'Lawn Aerator', category: 'Garden Tools', price: 22, desc: 'Core aerator for lawn maintenance', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' },
  { name: 'Garden Tiller', category: 'Garden Tools', price: 35, desc: 'Gas-powered garden tiller for soil preparation', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  { name: 'Pole Saw', category: 'Garden Tools', price: 24, desc: 'Extendable pole saw for high branches', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400' },
  { name: 'Sod Cutter', category: 'Garden Tools', price: 45, desc: 'Manual sod cutter for landscaping', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' },
  { name: 'Wheelbarrow Heavy-Duty', category: 'Garden Tools', price: 12, desc: 'Steel wheelbarrow with pneumatic tire', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  { name: 'Post Hole Digger', category: 'Garden Tools', price: 30, desc: 'Gas-powered auger for fence posts', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400' },
  { name: 'Lawn Roller', category: 'Garden Tools', price: 18, desc: 'Fillable lawn roller for seeding and leveling', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' },

  // Safety Equipment (10)
  { name: 'Safety Harness Kit', category: 'Safety Equipment', price: 25, desc: 'Full-body safety harness with lanyard', img: 'https://images.unsplash.com/photo-1581092918484-8313e1f7f00d?w=400' },
  { name: 'Portable Eye Wash Station', category: 'Safety Equipment', price: 15, desc: 'OSHA-compliant portable eye wash', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { name: 'Safety Barricade Kit', category: 'Safety Equipment', price: 20, desc: 'Traffic safety cones and barricades', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Fire Extinguisher ABC', category: 'Safety Equipment', price: 10, desc: '10-lb ABC rated fire extinguisher', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { name: 'Hard Hat with Face Shield', category: 'Safety Equipment', price: 8, desc: 'ANSI-approved hard hat with face protection', img: 'https://images.unsplash.com/photo-1581092918484-8313e1f7f00d?w=400' },
  { name: 'Safety Vest Hi-Vis Pack', category: 'Safety Equipment', price: 5, desc: 'High-visibility safety vest set (5 pack)', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Respirator Full-Face', category: 'Safety Equipment', price: 18, desc: 'Full-face respirator with cartridges', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { name: 'Safety Gloves Kit', category: 'Safety Equipment', price: 7, desc: 'Assorted work gloves for various tasks', img: 'https://images.unsplash.com/photo-1581092918484-8313e1f7f00d?w=400' },
  { name: 'First Aid Kit Large', category: 'Safety Equipment', price: 12, desc: 'Comprehensive first aid kit for job sites', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Safety Glasses Bulk Pack', category: 'Safety Equipment', price: 6, desc: 'ANSI Z87.1 safety glasses (10 pack)', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },

  // Measuring Tools (10)
  { name: 'Laser Level 360°', category: 'Measuring Tools', price: 35, desc: 'Self-leveling 360-degree laser level', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { name: 'Digital Angle Finder', category: 'Measuring Tools', price: 14, desc: 'Digital angle gauge and level', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400' },
  { name: 'Measuring Tape 100ft', category: 'Measuring Tools', price: 8, desc: 'Heavy-duty 100-foot measuring tape', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Moisture Meter', category: 'Measuring Tools', price: 12, desc: 'Digital moisture meter for wood and drywall', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Infrared Thermometer', category: 'Measuring Tools', price: 16, desc: 'Non-contact infrared temperature gun', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400' },
  { name: 'Transit Level with Tripod', category: 'Measuring Tools', price: 40, desc: 'Professional surveying transit level', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { name: 'Caliper Digital 12-inch', category: 'Measuring Tools', price: 10, desc: 'Precision digital caliper for accurate measurements', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
  { name: 'Feeler Gauge Set', category: 'Measuring Tools', price: 6, desc: 'Precision feeler gauge set for gap measurement', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Ultrasonic Distance Meter', category: 'Measuring Tools', price: 22, desc: 'Digital ultrasonic distance measuring tool', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400' },
  { name: 'Combination Square Set', category: 'Measuring Tools', price: 9, desc: 'Professional combination square with protractor', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400' },
];

console.log('Adding 50 new tools to the database...\n');

let completed = 0;
const errors = [];

tools.forEach((tool, index) => {
  const query = `INSERT INTO tools (name, category, price_per_day, description, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)`;
  const stock = Math.floor(Math.random() * 3) + 1; // Random stock between 1-3

  db.run(query, [tool.name, tool.category, tool.price, tool.desc, tool.img, stock], function(err) {
    if (err) {
      errors.push(`Error adding ${tool.name}: ${err.message}`);
    } else {
      console.log(`✓ Added: ${tool.name} (ID: ${this.lastID}, Stock: ${stock})`);
    }

    completed++;

    if (completed === tools.length) {
      console.log(`\n========================================`);
      console.log(`Successfully added ${tools.length - errors.length} tools!`);
      if (errors.length > 0) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach(err => console.log(`  ✗ ${err}`));
      }
      console.log(`========================================\n`);
      db.close();
    }
  });
});
