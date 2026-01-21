const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get contact information (public route)
router.get('/', (req, res) => {
  db.get('SELECT email, phone, address, signup_message, privacy_policy, email_important_message FROM contact_info WHERE id = 1', (err, contactInfo) => {
    if (err) {
      console.error('Error fetching contact info:', err);
      return res.status(500).json({ error: 'Failed to fetch contact information' });
    }

    if (!contactInfo) {
      // Return default values if not found
      return res.json({
        email: 'contact@toolrental.com',
        phone: '+972 50-123-4567',
        address: '123 Tool Street, Tel Aviv, Israel',
        signup_message: 'Welcome to our Tool Rental service! We are excited to have you on board.',
        privacy_policy: null,
        email_important_message: ''
      });
    }

    res.json(contactInfo);
  });
});

// Update contact information (admin only)
router.put('/', authenticateToken, isAdmin, (req, res) => {
  const { email, phone, address, signup_message, privacy_policy, email_important_message } = req.body;

  // Validation
  if (!email || !phone || !address) {
    return res.status(400).json({ error: 'Email, phone, and address are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  db.run(
    'UPDATE contact_info SET email = ?, phone = ?, address = ?, signup_message = ?, privacy_policy = ?, email_important_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [email, phone, address, signup_message || null, privacy_policy || null, email_important_message || ''],
    function (err) {
      if (err) {
        console.error('Error updating contact info:', err);
        return res.status(500).json({ error: 'Failed to update contact information' });
      }

      res.json({
        message: 'Contact information updated successfully',
        contactInfo: { email, phone, address, signup_message, privacy_policy, email_important_message }
      });
    }
  );
});

module.exports = router;
