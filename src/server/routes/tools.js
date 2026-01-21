const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all tools (public)
router.get('/', (req, res) => {
  const { category } = req.query;

  let query = 'SELECT * FROM tools WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  db.all(query, params, (err, tools) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch tools' });
    }
    res.json(tools);
  });
});

// Get tool by ID (public)
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM tools WHERE id = ?', [req.params.id], (err, tool) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json(tool);
  });
});

// Create new tool (admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { name, category, price_per_day, description, image_url, stock, is_available } = req.body;

  if (!name || !category || !price_per_day) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const toolStock = stock !== undefined ? stock : 5;
  const toolAvailable = is_available !== undefined ? (is_available ? 1 : 0) : 1;

  db.run(
    'INSERT INTO tools (name, category, price_per_day, description, image_url, stock, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category, price_per_day, description, image_url, toolStock, toolAvailable],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create tool' });
      }
      res.status(201).json({
        message: 'Tool created successfully',
        tool: { id: this.lastID, name, category, price_per_day, description, image_url, stock: toolStock, is_available: toolAvailable }
      });
    }
  );
});

// Update tool (admin only)
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, category, price_per_day, description, image_url, stock, is_available } = req.body;

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category);
  }
  if (price_per_day !== undefined) {
    updates.push('price_per_day = ?');
    params.push(price_per_day);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (image_url !== undefined) {
    updates.push('image_url = ?');
    params.push(image_url);
  }
  if (stock !== undefined) {
    updates.push('stock = ?');
    params.push(stock);
  }
  if (is_available !== undefined) {
    updates.push('is_available = ?');
    params.push(is_available ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(req.params.id);

  db.run(
    `UPDATE tools SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update tool' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tool not found' });
      }
      res.json({ message: 'Tool updated successfully' });
    }
  );
});

// Delete tool (admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM tools WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete tool' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json({ message: 'Tool deleted successfully' });
  });
});

// Get tool availability (with stock management)
router.get('/:id/availability', (req, res) => {
  const { start, end, quantity, cartQuantity } = req.query;
  const toolId = req.params.id;
  const requestedQuantity = parseInt(quantity) || 1;
  const alreadyInCart = parseInt(cartQuantity) || 0;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  // Check if tool exists and get total stock
  db.get('SELECT is_available, stock FROM tools WHERE id = ?', [toolId], (err, tool) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (!tool.is_available) {
      return res.json({
        available: false,
        availableStock: 0,
        reason: 'Tool is in maintenance'
      });
    }

    // Get all overlapping active and overdue reservations with their quantities
    const today = new Date().toISOString().split('T')[0];

    db.all(
      `SELECT quantity, status, start_date, end_date FROM reservations
       WHERE tool_id = ?
       AND (status = 'active' OR status = 'delivered' OR status = 'overdue')`,
      [toolId],
      (err, allReservations) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }

        // Calculate reserved quantity for this date range
        // Note: cancelled and returned reservations are excluded and don't reduce availability
        const reservedQuantity = allReservations.reduce((sum, r) => {
          if (r.status === 'active') {
            // Active reservations: check normal date overlap
            if (r.start_date <= end && r.end_date >= start) {
              return sum + (r.quantity || 1);
            }
          } else if (r.status === 'delivered') {
            // Delivered reservations: tool is with customer, always block
            if (r.start_date <= end && r.end_date >= start) {
              return sum + (r.quantity || 1);
            }
          } else if (r.status === 'overdue') {
            // Overdue reservations: only block dates from start_date to today
            // They don't block future dates beyond today
            const overdueEndDate = today;
            if (r.start_date <= end && overdueEndDate >= start) {
              return sum + (r.quantity || 1);
            }
          }
          return sum;
        }, 0);

        // Calculate available stock: total - reserved - already in cart
        const availableStock = tool.stock - reservedQuantity - alreadyInCart;

        res.json({
          available: availableStock >= requestedQuantity,
          availableStock: availableStock,
          totalStock: tool.stock,
          reservedStock: reservedQuantity,
          cartQuantity: alreadyInCart,
          requestedQuantity: requestedQuantity,
          reason: availableStock >= requestedQuantity
            ? null
            : `Only ${availableStock} tool(s) available for these dates (${reservedQuantity} reserved${alreadyInCart > 0 ? `, ${alreadyInCart} in cart` : ''})`
        });
      }
    );
  });
});

// Get all tools availability for a specific date
router.get('/availability/date', (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date required' });
  }

  db.all('SELECT id, name, category FROM tools', [], (err, tools) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    const availability = {};
    let completed = 0;

    const today = new Date().toISOString().split('T')[0];

    tools.forEach(tool => {
      db.all(
        `SELECT status, start_date, end_date FROM reservations
         WHERE tool_id = ?
         AND (status = 'active' OR status = 'delivered' OR status = 'overdue')`,
        [tool.id],
        (err, allReservations) => {
          // Check if any reservation overlaps with the requested date
          // Note: cancelled and returned reservations don't block availability
          const hasConflict = allReservations.some(r => {
            if (r.status === 'active') {
              // Active reservations: check normal date overlap
              return r.start_date <= date && r.end_date >= date;
            } else if (r.status === 'delivered') {
              // Delivered reservations: tool is with customer
              return r.start_date <= date && r.end_date >= date;
            } else if (r.status === 'overdue') {
              // Overdue reservations: only block dates up to today
              const overdueEndDate = today;
              return r.start_date <= date && overdueEndDate >= date;
            }
            return false;
          });

          availability[tool.id] = {
            ...tool,
            available: !hasConflict
          };

          completed++;
          if (completed === tools.length) {
            res.json(availability);
          }
        }
      );
    });

    if (tools.length === 0) {
      res.json(availability);
    }
  });
});

module.exports = router;
