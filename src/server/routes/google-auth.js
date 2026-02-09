const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const { sendSignupConfirmation } = require('../utils/emailService');

// Google OAuth - Verify ID Token
// Set createIfNotExists: false to check if user exists without creating (for login page)
// Set createIfNotExists: true to create user if not exists (for signup page or after privacy acceptance)
router.post('/google', async (req, res) => {
  try {
    const { credential, createIfNotExists = true } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Decode the JWT token from Google (in production, verify with Google's library)
    // For now, we'll decode it to get user info
    const decodedToken = jwt.decode(credential);

    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = decodedToken;

    // Check if user exists
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        let userId;
        let isAdmin = false;
        let isNewUser = false;

        if (user) {
          // User exists - update their Google ID if not set
          if (!user.google_id) {
            db.run(
              'UPDATE users SET google_id = ? WHERE id = ?',
              [googleId, user.id],
              (err) => {
                if (err) {
                  console.error('Error updating Google ID:', err);
                }
              }
            );
          }
          userId = user.id;
          isAdmin = user.role === 'admin';
          isNewUser = false;
        } else {
          // User doesn't exist
          if (!createIfNotExists) {
            // Return indication that user needs to accept privacy policy first
            return res.json({
              needsPrivacyAcceptance: true,
              email,
              name: name || email.split('@')[0],
              picture
            });
          }

          // Create new user (only when createIfNotExists is true)
          const result = await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO users (email, name, password_hash, google_id, role) VALUES (?, ?, ?, ?, ?)',
              [email, name || email.split('@')[0], 'GOOGLE_AUTH', googleId, 'user'],
              function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          });
          userId = result;
          isAdmin = false;
          isNewUser = true;

          // Send signup confirmation email IMMEDIATELY for new Google users
          try {
            const emailResult = await sendSignupConfirmation(email, name || email.split('@')[0]);
            if (emailResult.success) {
              console.log('✅ Signup confirmation email sent to:', email);
            } else {
              console.error('⚠️ Failed to send email:', emailResult.error);
            }
          } catch (err) {
            console.error('⚠️ Error sending signup confirmation email:', err);
            // Continue even if email fails - don't block the signup
          }
        }

        // Generate JWT token (use 'id' to match regular login)
        const token = jwt.sign(
          { id: userId, email, role: isAdmin ? 'admin' : 'user' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
          token,
          user: {
            id: userId,
            email,
            name: name || email.split('@')[0],
            role: isAdmin ? 'admin' : 'user',
            picture
          },
          isNewUser
        });
      }
    );
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
