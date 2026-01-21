const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken, isAdmin, isAdminOrSubadmin } = require('../middleware/auth');
const { sendSignupConfirmation, sendPasswordReset } = require('../utils/emailService');

const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  const { name, email, phone_number, password, role = 'user' } = req.body;

  if (!name || !email || !phone_number || !password) {
    return res.status(400).json({ error: 'Name, email, phone number, and password are required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Basic phone number validation (remove spaces, dashes, parentheses)
  const cleanedPhone = phone_number.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(cleanedPhone)) {
    return res.status(400).json({ error: 'Invalid phone number format (10-15 digits)' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (name, email, phone_number, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, cleanedPhone, hashedPassword, role],
      async function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            if (err.message.includes('email')) {
              return res.status(400).json({ error: 'Email already exists' });
            } else if (err.message.includes('phone_number')) {
              return res.status(400).json({ error: 'Phone number already exists' });
            }
            return res.status(400).json({ error: 'Email or phone number already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }

        const token = jwt.sign(
          { id: this.lastID, email, role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Send signup confirmation email IMMEDIATELY (wait for it to complete)
        try {
          const emailResult = await sendSignupConfirmation(email, name);
          if (emailResult.success) {
            console.log('✅ Signup confirmation email sent to:', email);
          } else {
            console.error('⚠️ Failed to send email:', emailResult.error);
          }
        } catch (err) {
          console.error('⚠️ Error sending signup confirmation email:', err);
          // Continue even if email fails - don't block the signup
        }

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: { id: this.lastID, name, email, phone_number: cleanedPhone, role }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Get Current User
router.get('/me', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, name, phone_number, email, role, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Update Profile
router.put('/profile', authenticateToken, (req, res) => {
  const { phone_number, name } = req.body;

  if (!phone_number && !name) {
    return res.status(400).json({ error: 'At least one field (phone_number or name) is required' });
  }

  // Validate phone number if provided
  if (phone_number) {
    const cleanedPhone = phone_number.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format (10-15 digits)' });
    }

    // Check if phone number is already taken by another user
    db.get(
      'SELECT id FROM users WHERE phone_number = ? AND id != ?',
      [cleanedPhone, req.user.id],
      (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }
        if (existingUser) {
          return res.status(400).json({ error: 'Phone number already in use' });
        }

        // Update the user profile
        updateUserProfile(req.user.id, cleanedPhone, name, res);
      }
    );
  } else {
    // Only updating name
    updateUserProfile(req.user.id, null, name, res);
  }
});

function updateUserProfile(userId, phone_number, name, res) {
  let updateQuery = 'UPDATE users SET ';
  const updateParams = [];
  const fields = [];

  if (phone_number) {
    fields.push('phone_number = ?');
    updateParams.push(phone_number);
  }

  if (name) {
    fields.push('name = ?');
    updateParams.push(name);
  }

  updateQuery += fields.join(', ');
  updateQuery += ' WHERE id = ?';
  updateParams.push(userId);

  db.run(updateQuery, updateParams, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Fetch and return updated user info
    db.get(
      'SELECT id, name, phone_number, email, role, created_at FROM users WHERE id = ?',
      [userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }
        res.json({
          message: 'Profile updated successfully',
          user
        });
      }
    );
  });
}

// Password Reset Request - sends reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      // Don't reveal if email exists (security best practice)
      return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send password reset email IMMEDIATELY
    try {
      const emailResult = await sendPasswordReset(user.email, user.name, resetToken);
      if (emailResult.success) {
        console.log('✅ Password reset email sent to:', user.email);
      } else {
        console.error('⚠️ Failed to send password reset email:', emailResult.error);
      }
    } catch (err) {
      console.error('⚠️ Error sending password reset email:', err);
    }

    res.json({ message: 'If your email is registered, you will receive a password reset link' });
  });
});

// Reset Password
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, decoded.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update password' });
          }
          res.json({ message: 'Password reset successful' });
        }
      );
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Get All Users (Admin and Subadmin)
router.get('/users', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT
      u.id,
      u.name,
      u.phone_number,
      u.email,
      u.role,
      u.created_at,
      COUNT(CASE WHEN r.status != 'archived' THEN 1 END) as active_reservations_count
    FROM users u
    LEFT JOIN reservations r ON u.id = r.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC`,
    [],
    (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(users);
    }
  );
});

// Update User Role (Admin Only)
router.put('/users/:id/role', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  // Validate role
  const validRoles = ['user', 'subadmin', 'admin'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be user, subadmin, or admin' });
  }

  // Prevent admin from changing their own role
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  db.run(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, userId],
    function (err) {
      if (err) {
        console.error('Error updating user role:', err);
        return res.status(500).json({ error: 'Failed to update user role' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User role updated successfully', role });
    }
  );
});

// Delete User (Admin Only)
router.delete('/users/:id', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  // Prevent admin from deleting themselves
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Check if user has ANY reservations visible in View Reservations (i.e., not archived)
  db.get(
    `SELECT COUNT(*) as visible_count
     FROM reservations
     WHERE user_id = ? AND status != 'archived'`,
    [userId],
    (err, result) => {
      if (err) {
        console.error('Error checking reservations:', err);
        return res.status(500).json({ error: 'Failed to check user reservations' });
      }

      if (result.visible_count > 0) {
        return res.status(400).json({
          error: `Cannot delete user with ${result.visible_count} visible reservation(s). All user reservations must be archived before deletion.`
        });
      }

      // Proceed with deletion
      db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
        if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ error: 'Failed to delete user' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
      });
    }
  );
});

module.exports = router;
