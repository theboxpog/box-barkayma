const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get allowed rental days (public endpoint - no authentication required)
router.get('/rental-days', (req, res) => {
  db.get(
    `SELECT setting_value FROM rental_settings WHERE setting_key = 'allowed_rental_days'`,
    [],
    (err, row) => {
      if (err) {
        console.error('Error fetching rental days:', err);
        return res.status(500).json({ error: 'Failed to fetch rental days' });
      }

      if (!row) {
        // Return default if not found
        return res.json({ allowedDays: [0, 1, 2, 3, 4, 5, 6] });
      }

      try {
        const allowedDays = JSON.parse(row.setting_value);
        res.json({ allowedDays });
      } catch (parseError) {
        console.error('Error parsing rental days:', parseError);
        res.status(500).json({ error: 'Failed to parse rental days' });
      }
    }
  );
});

// Update allowed rental days (admin only)
router.put('/rental-days', authenticateToken, isAdmin, (req, res) => {
  const { allowedDays } = req.body;

  // Validate input
  if (!Array.isArray(allowedDays)) {
    return res.status(400).json({ error: 'allowedDays must be an array' });
  }

  if (allowedDays.length === 0) {
    return res.status(400).json({ error: 'At least one day must be allowed' });
  }

  // Validate that all days are between 0-6
  if (!allowedDays.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) {
    return res.status(400).json({ error: 'All days must be integers between 0 and 6' });
  }

  const allowedDaysJson = JSON.stringify(allowedDays);

  db.run(
    `UPDATE rental_settings
     SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
     WHERE setting_key = 'allowed_rental_days'`,
    [allowedDaysJson],
    function(err) {
      if (err) {
        console.error('Error updating rental days:', err);
        return res.status(500).json({ error: 'Failed to update rental days' });
      }

      if (this.changes === 0) {
        // Insert if not exists
        db.run(
          `INSERT INTO rental_settings (setting_key, setting_value)
           VALUES ('allowed_rental_days', ?)`,
          [allowedDaysJson],
          (insertErr) => {
            if (insertErr) {
              console.error('Error inserting rental days:', insertErr);
              return res.status(500).json({ error: 'Failed to insert rental days' });
            }
            res.json({ success: true, allowedDays });
          }
        );
      } else {
        res.json({ success: true, allowedDays });
      }
    }
  );
});

module.exports = router;
