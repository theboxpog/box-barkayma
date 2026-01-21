const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin, isAdminOrSubadmin } = require('../middleware/auth');
const { sendReservationConfirmation } = require('../utils/emailService');

const router = express.Router();

// Helper function to automatically mark overdue reservations
function autoMarkOverdue(callback) {
  const today = new Date().toISOString().split('T')[0];

  db.run(
    `UPDATE reservations
     SET status = 'overdue'
     WHERE (status = 'active' OR status = 'delivered')
     AND end_date < ?`,
    [today],
    (err) => {
      if (err) {
        console.error('Error auto-marking overdue reservations:', err);
      }
      if (callback) callback();
    }
  );
}

// Create reservation
router.post('/', authenticateToken, (req, res) => {
  const { tool_id, start_date, end_date, quantity, total_price } = req.body;
  const user_id = req.user.id;
  const toolQuantity = quantity || 1;

  if (!tool_id || !start_date || !end_date || !total_price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate dates
  const start = new Date(start_date);
  const end = new Date(end_date);

  if (end <= start) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  // Check allowed rental days
  db.get(
    `SELECT setting_value FROM rental_settings WHERE setting_key = 'allowed_rental_days'`,
    [],
    (err, setting) => {
      if (err) {
        console.error('Error fetching rental days:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      let allowedDays = [0, 1, 2, 3, 4, 5, 6]; // Default: all days
      if (setting && setting.setting_value) {
        try {
          allowedDays = JSON.parse(setting.setting_value);
        } catch (parseError) {
          console.error('Error parsing rental days:', parseError);
        }
      }

      const startDayOfWeek = start.getDay();
      const endDayOfWeek = end.getDay();

      if (!allowedDays.includes(startDayOfWeek)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return res.status(400).json({
          error: `Start date (${dayNames[startDayOfWeek]}) is not an allowed rental day. Allowed days: ${allowedDays.map(d => dayNames[d]).join(', ')}`
        });
      }

      if (!allowedDays.includes(endDayOfWeek)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return res.status(400).json({
          error: `End date (${dayNames[endDayOfWeek]}) is not an allowed rental day. Allowed days: ${allowedDays.map(d => dayNames[d]).join(', ')}`
        });
      }

      continueWithReservation();
    }
  );

  function continueWithReservation() {

  // Check if tool exists and is available
  db.get('SELECT * FROM tools WHERE id = ?', [tool_id], (err, tool) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (!tool.is_available) {
      return res.status(400).json({ error: 'Tool is not available' });
    }

    // Check stock availability for the date range
    const today = new Date().toISOString().split('T')[0];

    db.all(
      `SELECT quantity, status, start_date, end_date FROM reservations
       WHERE tool_id = ?
       AND (status = 'active' OR status = 'delivered' OR status = 'overdue')`,
      [tool_id],
      (err, allReservations) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }

        // Calculate reserved quantity for this date range
        // For overdue reservations, only count them if they overlap with requested dates up to today
        // For active and delivered reservations, use the normal date range check
        const reservedQuantity = allReservations.reduce((sum, r) => {
          if (r.status === 'active') {
            // Active reservations: check normal date overlap
            if (r.start_date <= end_date && r.end_date >= start_date) {
              return sum + (r.quantity || 1);
            }
          } else if (r.status === 'delivered') {
            // Delivered reservations: tool is with customer, always block
            if (r.start_date <= end_date && r.end_date >= start_date) {
              return sum + (r.quantity || 1);
            }
          } else if (r.status === 'overdue') {
            // Overdue reservations: only block dates from start_date to today
            // They don't block future dates beyond today
            const overdueEndDate = today;
            if (r.start_date <= end_date && overdueEndDate >= start_date) {
              return sum + (r.quantity || 1);
            }
          }
          return sum;
        }, 0);

        const availableStock = tool.stock - reservedQuantity;

        if (availableStock < toolQuantity) {
          return res.status(400).json({
            error: `Insufficient stock. Only ${availableStock} tool(s) available for these dates.`,
            availableStock: availableStock,
            requestedQuantity: toolQuantity
          });
        }

        // Create reservation
        db.run(
          'INSERT INTO reservations (user_id, tool_id, start_date, end_date, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user_id, tool_id, start_date, end_date, toolQuantity, total_price, 'active'],
          async function (err) {
            if (err) {
              console.error('Database error creating reservation:', err);
              console.error('Data:', { user_id, tool_id, start_date, end_date, toolQuantity, total_price });
              return res.status(500).json({ error: 'Failed to create reservation', details: err.message });
            }

            const reservationId = this.lastID;

            res.status(201).json({
              message: 'Reservation created successfully',
              reservation: {
                id: reservationId,
                user_id,
                tool_id,
                start_date,
                end_date,
                quantity: toolQuantity,
                total_price,
                status: 'active'
              }
            });
          }
        );
      }
    );
  });
  }
});

// Get user's reservations
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Auto-mark overdue reservations before fetching
  autoMarkOverdue(() => {
    db.all(
      `SELECT r.*, t.name as tool_name, t.category, t.image_url
       FROM reservations r
       JOIN tools t ON r.tool_id = t.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
      (err, reservations) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch reservations' });
        }
        res.json(reservations);
      }
    );
  });
});

// Batch create reservations (for checkout) - sends ONE email for all items
router.post('/batch', authenticateToken, async (req, res) => {
  const { reservations } = req.body;
  const user_id = req.user.id;

  if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
    return res.status(400).json({ error: 'Reservations array is required' });
  }

  try {
    // Create all reservations
    const createdReservations = [];
    const reservationDetails = [];

    for (const item of reservations) {
      const { tool_id, start_date, end_date, quantity, total_price } = item;

      // Create reservation synchronously
      const reservationId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO reservations (user_id, tool_id, start_date, end_date, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user_id, tool_id, start_date, end_date, quantity || 1, total_price, 'active'],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Get tool name for email
      const tool = await new Promise((resolve, reject) => {
        db.get('SELECT name FROM tools WHERE id = ?', [tool_id], (err, tool) => {
          if (err) reject(err);
          else resolve(tool);
        });
      });

      createdReservations.push({
        id: reservationId,
        user_id,
        tool_id,
        start_date,
        end_date,
        quantity: quantity || 1,
        total_price,
        status: 'active'
      });

      reservationDetails.push({
        toolName: tool.name,
        quantity: quantity || 1,
        startDate: start_date,
        endDate: end_date,
        totalPrice: total_price
      });
    }

    // Get user details for email
    db.get('SELECT name, email FROM users WHERE id = ?', [user_id], async (err, user) => {
      if (!err && user) {
        // Send ONE reservation confirmation email for ALL items
        try {
          const emailResult = await sendReservationConfirmation(user.email, user.name, reservationDetails);
          if (emailResult.success) {
            console.log('✅ Reservation confirmation email sent to:', user.email);
          } else {
            console.error('⚠️ Failed to send reservation email:', emailResult.error);
          }
        } catch (emailErr) {
          console.error('⚠️ Error sending reservation confirmation email:', emailErr);
          // Don't fail the checkout if email fails
        }
      }
    });

    res.status(201).json({
      message: 'Reservations created successfully',
      reservations: createdReservations
    });
  } catch (error) {
    console.error('Error creating batch reservations:', error);
    res.status(500).json({ error: 'Failed to create reservations' });
  }
});

// Get all reservations (admin and subadmin)
router.get('/admin/all', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const { status, tool_id } = req.query;

  // Auto-mark overdue reservations before fetching
  autoMarkOverdue(() => {
    let query = `
      SELECT r.*, u.name as user_name, u.email as user_email,
             t.name as tool_name, t.category
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN tools t ON r.tool_id = t.id
      WHERE r.status != 'archived'
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (tool_id) {
      query += ' AND r.tool_id = ?';
      params.push(tool_id);
    }

    query += ' ORDER BY r.created_at DESC';

    db.all(query, params, (err, reservations) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch reservations' });
      }
      res.json(reservations);
    });
  });
});

// Get specific reservation
router.get('/:id', authenticateToken, (req, res) => {
  const reservationId = req.params.id;
  const userId = req.user.id;
  const isAdminUser = req.user.role === 'admin';

  let query = `
    SELECT r.*, t.name as tool_name, t.category, t.image_url,
           u.name as user_name, u.email as user_email
    FROM reservations r
    JOIN tools t ON r.tool_id = t.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `;

  if (!isAdminUser) {
    query += ' AND r.user_id = ?';
  }

  const params = isAdminUser ? [reservationId] : [reservationId, userId];

  db.get(query, params, (err, reservation) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  });
});

// Cancel reservation
router.delete('/:id', authenticateToken, (req, res) => {
  const reservationId = req.params.id;
  const userId = req.user.id;
  const isAdminUser = req.user.role === 'admin';

  // First check if reservation exists and belongs to user
  let checkQuery = 'SELECT * FROM reservations WHERE id = ?';
  const checkParams = [reservationId];

  if (!isAdminUser) {
    checkQuery += ' AND user_id = ?';
    checkParams.push(userId);
  }

  db.get(checkQuery, checkParams, (err, reservation) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Update status to cancelled
    db.run(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['cancelled', reservationId],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to cancel reservation' });
        }
        res.json({ message: 'Reservation cancelled successfully' });
      }
    );
  });
});

// Update reservation (admin only)
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { status, start_date, end_date, total_price } = req.body;
  const reservationId = req.params.id;

  const updates = [];
  const params = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (start_date !== undefined) {
    updates.push('start_date = ?');
    params.push(start_date);
  }
  if (end_date !== undefined) {
    updates.push('end_date = ?');
    params.push(end_date);
  }
  if (total_price !== undefined) {
    updates.push('total_price = ?');
    params.push(total_price);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(reservationId);

  db.run(
    `UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update reservation' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json({ message: 'Reservation updated successfully' });
    }
  );
});

// Admin: Update reservation status (cancel, mark as delivered, etc.)
router.patch('/:id/status', authenticateToken, isAdmin, (req, res) => {
  const { status } = req.body;
  const reservationId = req.params.id;

  const validStatuses = ['active', 'cancelled', 'completed', 'delivered', 'returned', 'overdue', 'archived'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Valid status is required (active, cancelled, completed, delivered, returned, overdue, archived)'
    });
  }

  db.run(
    'UPDATE reservations SET status = ? WHERE id = ?',
    [status, reservationId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update reservation status' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json({
        message: 'Reservation status updated successfully',
        status: status
      });
    }
  );
});

// Admin: Cancel reservation
router.post('/:id/cancel', authenticateToken, isAdmin, (req, res) => {
  const reservationId = req.params.id;

  db.run(
    'UPDATE reservations SET status = ? WHERE id = ?',
    ['cancelled', reservationId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to cancel reservation' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json({ message: 'Reservation cancelled successfully' });
    }
  );
});

// Admin/Subadmin: Mark reservation as delivered
router.post('/:id/deliver', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const reservationId = req.params.id;

  db.run(
    'UPDATE reservations SET status = ? WHERE id = ?',
    ['delivered', reservationId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark reservation as delivered' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json({ message: 'Reservation marked as delivered successfully' });
    }
  );
});

// Admin/Subadmin: Mark reservation as returned
router.post('/:id/return', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const reservationId = req.params.id;

  db.run(
    'UPDATE reservations SET status = ? WHERE id = ?',
    ['returned', reservationId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark reservation as returned' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json({ message: 'Reservation marked as returned successfully' });
    }
  );
});

// Admin: Permanently delete reservation
router.delete('/:id/permanent', authenticateToken, isAdmin, (req, res) => {
  const reservationId = req.params.id;

  // First, delete associated payments
  db.run('DELETE FROM payments WHERE reservation_id = ?', [reservationId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete payments' });
    }

    // Then delete the reservation
    db.run('DELETE FROM reservations WHERE id = ?', [reservationId], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete reservation' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json({
        message: 'Reservation permanently deleted',
        deleted: true
      });
    });
  });
});

// User: Permanently delete own reservation (only if not active)
router.delete('/:id/user-delete', authenticateToken, (req, res) => {
  const reservationId = req.params.id;
  const userId = req.user.id;

  // Check if reservation belongs to user and is not active
  db.get(
    'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
    [reservationId, userId],
    (err, reservation) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      if (reservation.status === 'active') {
        return res.status(400).json({
          error: 'Cannot delete active reservations. Please cancel first.'
        });
      }

      // Delete associated payments
      db.run('DELETE FROM payments WHERE reservation_id = ?', [reservationId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete payments' });
        }

        // Delete the reservation
        db.run('DELETE FROM reservations WHERE id = ?', [reservationId], function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete reservation' });
          }
          res.json({
            message: 'Reservation permanently deleted',
            deleted: true
          });
        });
      });
    }
  );
});

// Admin/Subadmin: Mark overdue reservations
router.post('/admin/mark-overdue', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.run(
    `UPDATE reservations
     SET status = 'overdue'
     WHERE (status = 'active' OR status = 'delivered')
     AND end_date < ?`,
    [today],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark overdue reservations' });
      }
      res.json({
        message: 'Overdue reservations marked successfully',
        count: this.changes
      });
    }
  );
});

// Admin/Subadmin: Get overdue reservations
router.get('/admin/overdue', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT r.*, u.name as user_name, u.email as user_email,
            t.name as tool_name, t.category
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN tools t ON r.tool_id = t.id
     WHERE r.status = 'overdue'
     ORDER BY r.end_date ASC`,
    [],
    (err, reservations) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch overdue reservations' });
      }
      res.json(reservations);
    }
  );
});

// Admin/Subadmin: Get active reservations
router.get('/admin/active', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT r.*, u.name as user_name, u.email as user_email,
            t.name as tool_name, t.category
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN tools t ON r.tool_id = t.id
     WHERE r.status = 'active'
     ORDER BY r.start_date ASC`,
    [],
    (err, reservations) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch active reservations' });
      }
      res.json(reservations);
    }
  );
});

// Admin/Subadmin: Archive reservation (soft delete)
router.post('/:id/archive', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const reservationId = req.params.id;

  // First, get the current status to save it as previous_status
  db.get('SELECT status FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch reservation' });
    }
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Save current status as previous_status and set status to archived
    db.run(
      'UPDATE reservations SET status = ?, previous_status = ? WHERE id = ?',
      ['archived', reservation.status, reservationId],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to archive reservation' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({ message: 'Reservation archived successfully' });
      }
    );
  });
});

// Admin/Subadmin: Get archived reservations
router.get('/admin/archived', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT r.*, u.name as user_name, u.email as user_email,
            t.name as tool_name, t.category
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN tools t ON r.tool_id = t.id
     WHERE r.status = 'archived'
     ORDER BY r.created_at DESC`,
    [],
    (err, reservations) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch archived reservations' });
      }
      res.json(reservations);
    }
  );
});

// Admin/Subadmin: Restore archived reservation
router.post('/:id/restore', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const reservationId = req.params.id;

  // Get the reservation to restore its previous status
  db.get('SELECT previous_status FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Restore to previous status, or default to 'active' if no previous status was saved
    const restoredStatus = reservation.previous_status || 'active';

    db.run(
      'UPDATE reservations SET status = ?, previous_status = NULL WHERE id = ?',
      [restoredStatus, reservationId],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to restore reservation' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({
          message: 'Reservation restored successfully',
          status: restoredStatus
        });
      }
    );
  });
});

module.exports = router;
