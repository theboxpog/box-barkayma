const express = require('express');
const db = require('../database');
const { authenticateToken, isAdminOrSubadmin } = require('../middleware/auth');
const { sendReservationConfirmation, sendAdminReservationNotification } = require('../utils/emailService');

const router = express.Router();

// Helper: fetch a package with its tools
function getPackageWithTools(packageId, callback) {
  db.get('SELECT * FROM packages WHERE id = ?', [packageId], (err, pkg) => {
    if (err) return callback(err);
    if (!pkg) return callback(null, null);
    db.all(
      `SELECT pt.id, pt.tool_id, pt.quantity as pkg_quantity,
              t.name as tool_name, t.category, t.rental_type,
              t.price_per_day, t.fixed_price, t.stock, t.is_available, t.image_url
       FROM package_tools pt
       JOIN tools t ON pt.tool_id = t.id
       WHERE pt.package_id = ?`,
      [packageId],
      (err, tools) => {
        if (err) return callback(err);
        callback(null, { ...pkg, tools });
      }
    );
  });
}

// Helper: count how many of a tool are committed via active package reservations
function getPackageReservedQty(toolId, start, end, isFixedPrice, callback) {
  const today = new Date().toISOString().split('T')[0];
  db.all(
    `SELECT pr.quantity as pr_qty, pr.status, pr.start_date, pr.end_date,
            pt.quantity as pt_qty
     FROM package_reservations pr
     JOIN package_tools pt ON pr.package_id = pt.package_id
     WHERE pt.tool_id = ?
     AND pr.status IN ('active', 'delivered', 'overdue')`,
    [toolId],
    (err, rows) => {
      if (err) return callback(err, 0);
      const reserved = rows.reduce((sum, r) => {
        if (isFixedPrice) {
          return sum + (r.pr_qty || 1) * (r.pt_qty || 1);
        }
        if (r.status === 'active' || r.status === 'delivered') {
          if (r.start_date <= end && r.end_date >= start) {
            return sum + (r.pr_qty || 1) * (r.pt_qty || 1);
          }
        } else if (r.status === 'overdue') {
          if (r.start_date <= end && today >= start) {
            return sum + (r.pr_qty || 1) * (r.pt_qty || 1);
          }
        }
        return sum;
      }, 0);
      callback(null, reserved);
    }
  );
}

// ─── PUBLIC ────────────────────────────────────────────────────────────────

// GET /packages — list all available packages with their tools
router.get('/', (req, res) => {
  db.all('SELECT * FROM packages WHERE is_available = 1 ORDER BY created_at DESC', [], (err, packages) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch packages' });
    if (packages.length === 0) return res.json([]);

    let done = 0;
    const results = [];

    packages.forEach((pkg, i) => {
      db.all(
        `SELECT pt.quantity as pkg_quantity, t.name as tool_name, t.image_url,
                t.price_per_day, t.fixed_price, t.rental_type, t.stock, t.id as tool_id, t.category
         FROM package_tools pt
         JOIN tools t ON pt.tool_id = t.id
         WHERE pt.package_id = ?`,
        [pkg.id],
        (err, tools) => {
          results[i] = { ...pkg, tools: err ? [] : tools };
          if (++done === packages.length) res.json(results);
        }
      );
    });
  });
});

// GET /packages/:id — single package detail
router.get('/:id', (req, res) => {
  getPackageWithTools(req.params.id, (err, pkg) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  });
});

// GET /packages/:id/availability — check if package is available (no auth required)
router.get('/:id/availability', (req, res) => {
  const packageId = req.params.id;
  const { start_date, end_date, quantity } = req.query;
  const qty = parseInt(quantity) || 1;

  getPackageWithTools(packageId, (err, pkg) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    if (!pkg.is_available) return res.json({ available: false, reason: 'Package is not available' });

    const isFixed = pkg.rental_type === 'fixed_price';
    const pkgTools = pkg.tools || [];
    if (pkgTools.length === 0) return res.json({ available: true });

    let checkedCount = 0;
    let stockError = null;

    pkgTools.forEach(pt => {
      const needed = pt.pkg_quantity * qty;
      db.all(
        `SELECT r.quantity, r.status, r.start_date, r.end_date
         FROM reservations r WHERE r.tool_id = ? AND r.status IN ('active','delivered','overdue')`,
        [pt.tool_id],
        (err, rows) => {
          if (err) { checkedCount++; return finalize(); }
          const directReserved = (rows || []).reduce((sum, r) => {
            if (isFixed) return sum + (r.quantity || 1);
            if (!start_date || !end_date) return sum;
            if (r.start_date <= end_date && r.end_date >= start_date) return sum + (r.quantity || 1);
            return sum;
          }, 0);
          getPackageReservedQty(pt.tool_id, start_date || null, end_date || null, isFixed, (err2, pkgReserved) => {
            if (!stockError) {
              const available = pt.stock - directReserved - pkgReserved;
              if (available < needed) {
                stockError = `Insufficient stock for "${pt.tool_name}" (need ${needed}, available ${Math.max(0, available)})`;
              }
            }
            checkedCount++;
            finalize();
          });
        }
      );
    });

    function finalize() {
      if (checkedCount < pkgTools.length) return;
      if (stockError) return res.json({ available: false, reason: stockError });
      res.json({ available: true });
    }
  });
});

// POST /packages/:id/reserve — user reserves a package
router.post('/:id/reserve', authenticateToken, (req, res) => {
  const { start_date, end_date, quantity } = req.body;
  const userId = req.user.id;
  const packageId = req.params.id;
  const qty = parseInt(quantity) || 1;

  db.get('SELECT * FROM packages WHERE id = ? AND is_available = 1', [packageId], (err, pkg) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    if (pkg.rental_type === 'by_date' && (!start_date || !end_date)) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Calculate total price
    let totalPrice;
    if (pkg.rental_type === 'fixed_price') {
      totalPrice = (pkg.fixed_price || 0) * qty;
    } else {
      const days = Math.ceil(
        (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)
      );
      totalPrice = (pkg.price_per_day || 0) * days * qty;
    }

    // Fetch all tools in the package
    db.all(
      `SELECT pt.tool_id, pt.quantity as pkg_qty, t.stock, t.rental_type
       FROM package_tools pt
       JOIN tools t ON pt.tool_id = t.id
       WHERE pt.package_id = ?`,
      [packageId],
      (err, pkgTools) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (pkgTools.length === 0) {
          return res.status(400).json({ error: 'Package has no tools' });
        }

        // Check stock for all tools in the package
        let checkedCount = 0;
        let stockError = null;

        pkgTools.forEach(pt => {
          const needed = pt.pkg_qty * qty;
          const isFixed = pt.rental_type === 'fixed_price';

          db.all(
            `SELECT quantity, status, start_date, end_date FROM reservations
             WHERE tool_id = ? AND status IN ('active','delivered','overdue')`,
            [pt.tool_id],
            (err, resvs) => {
              if (stockError) return;
              if (err) {
                stockError = 'Server error checking availability';
                return finalize();
              }

              const today = new Date().toISOString().split('T')[0];
              const regularReserved = resvs.reduce((sum, r) => {
                if (isFixed) return sum + (r.quantity || 1);
                if (r.status === 'active' || r.status === 'delivered') {
                  if (r.start_date <= end_date && r.end_date >= start_date) return sum + (r.quantity || 1);
                } else if (r.status === 'overdue') {
                  if (r.start_date <= end_date && today >= start_date) return sum + (r.quantity || 1);
                }
                return sum;
              }, 0);

              getPackageReservedQty(
                pt.tool_id, start_date, end_date, isFixed,
                (err2, pkgReserved) => {
                  if (stockError) return;
                  const available = pt.stock - regularReserved - pkgReserved;
                  if (available < needed) {
                    stockError = `Insufficient stock for tool in package (need ${needed}, available ${available})`;
                  }
                  finalize();
                }
              );
            }
          );
        });

        function finalize() {
          checkedCount++;
          if (checkedCount < pkgTools.length) return;
          if (stockError) return res.status(400).json({ error: stockError });

          // Create package reservation
          db.run(
            `INSERT INTO package_reservations
             (package_id, user_id, start_date, end_date, quantity, total_price, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [packageId, userId, start_date || null, end_date || null, qty, totalPrice],
            function (err) {
              if (err) return res.status(500).json({ error: 'Failed to create reservation' });
              const reservation = {
                id: this.lastID,
                package_id: packageId,
                package_name: pkg.name,
                start_date,
                end_date,
                quantity: qty,
                total_price: totalPrice,
                status: 'active'
              };
              res.status(201).json({ message: 'Package reserved successfully', reservation });

              // Send confirmation emails (non-blocking)
              db.get('SELECT name, email FROM users WHERE id = ?', [userId], async (err2, user) => {
                if (err2 || !user) return;
                const reservationDetails = [{
                  toolName: pkg.name,
                  quantity: qty,
                  startDate: start_date || null,
                  endDate: end_date || null,
                  totalPrice,
                  isFixedPrice: pkg.rental_type === 'fixed_price'
                }];
                try {
                  await sendReservationConfirmation(user.email, user.name, reservationDetails, totalPrice);
                } catch (e) {
                  console.error('Failed to send package reservation email:', e);
                }
                try {
                  await sendAdminReservationNotification(user.name, user.email, reservationDetails, totalPrice);
                } catch (e) {
                  console.error('Failed to send admin package notification:', e);
                }
              });
            }
          );
        }
      }
    );
  });
});

// GET /packages/reservations/my — user's own package reservations
router.get('/reservations/my', authenticateToken, (req, res) => {
  db.all(
    `SELECT pr.*, p.name as package_name, p.category, p.rental_type,
            p.price_per_day, p.fixed_price, p.image_url
     FROM package_reservations pr
     JOIN packages p ON pr.package_id = p.id
     WHERE pr.user_id = ?
     ORDER BY pr.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch reservations' });
      res.json(rows);
    }
  );
});

// DELETE /packages/reservations/:id — user cancels their package reservation
router.delete('/reservations/:id', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM package_reservations WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!row) return res.status(404).json({ error: 'Reservation not found' });
      db.run(
        "UPDATE package_reservations SET status = 'cancelled' WHERE id = ?",
        [req.params.id],
        function (err) {
          if (err) return res.status(500).json({ error: 'Failed to cancel' });
          res.json({ message: 'Package reservation cancelled' });
        }
      );
    }
  );
});

// ─── ADMIN ─────────────────────────────────────────────────────────────────

// GET /packages/admin/all — all packages (incl. unavailable)
router.get('/admin/all', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all('SELECT * FROM packages ORDER BY created_at DESC', [], (err, packages) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch packages' });
    if (packages.length === 0) return res.json([]);

    let done = 0;
    const results = [];
    packages.forEach((pkg, i) => {
      db.all(
        `SELECT pt.quantity as pkg_quantity, t.id as tool_id, t.name as tool_name,
                t.category, t.rental_type, t.price_per_day, t.fixed_price, t.stock
         FROM package_tools pt
         JOIN tools t ON pt.tool_id = t.id
         WHERE pt.package_id = ?`,
        [pkg.id],
        (err, tools) => {
          results[i] = { ...pkg, tools: err ? [] : tools };
          if (++done === packages.length) res.json(results);
        }
      );
    });
  });
});

// POST /packages/admin — create package
router.post('/admin', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const { name, description, category, rental_type, price_per_day, fixed_price, image_url, is_available, tools } = req.body;

  if (!name || !rental_type) {
    return res.status(400).json({ error: 'Name and rental type are required' });
  }
  if (!tools || tools.length === 0) {
    return res.status(400).json({ error: 'At least one tool is required' });
  }
  if (rental_type === 'by_date' && !price_per_day) {
    return res.status(400).json({ error: 'Price per day is required for date-based packages' });
  }
  if (rental_type === 'fixed_price' && !fixed_price) {
    return res.status(400).json({ error: 'Fixed price is required for fixed-price packages' });
  }

  // Validate all tools have same rental_type and quantities don't exceed stock
  const toolIds = tools.map(t => t.tool_id);
  db.all(
    `SELECT id, name, rental_type, stock FROM tools WHERE id IN (${toolIds.map(() => '?').join(',')})`,
    toolIds,
    (err, dbTools) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      for (const t of dbTools) {
        if (t.rental_type !== rental_type) {
          return res.status(400).json({ error: `All tools must have the same rental type as the package (${rental_type})` });
        }
        const requested = tools.find(rt => rt.tool_id === t.id);
        if (requested && requested.quantity > t.stock) {
          return res.status(400).json({ error: `"${t.name}": quantity (${requested.quantity}) exceeds stock (${t.stock})` });
        }
      }

      const avail = is_available !== false ? 1 : 0;
      db.run(
        `INSERT INTO packages (name, description, category, rental_type, price_per_day, fixed_price, image_url, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description || null, category || '', rental_type, price_per_day || null, fixed_price || null, image_url || null, avail],
        function (err) {
          if (err) return res.status(500).json({ error: 'Failed to create package' });
          const packageId = this.lastID;

          // Insert package_tools
          const insertTool = (index) => {
            if (index >= tools.length) {
              return getPackageWithTools(packageId, (err, pkg) => {
                if (err) return res.status(500).json({ error: 'Package created but failed to fetch' });
                res.status(201).json({ message: 'Package created successfully', package: pkg });
              });
            }
            const { tool_id, quantity } = tools[index];
            db.run(
              'INSERT INTO package_tools (package_id, tool_id, quantity) VALUES (?, ?, ?)',
              [packageId, tool_id, quantity || 1],
              (err) => {
                if (err) console.error('Failed to insert package tool:', err);
                insertTool(index + 1);
              }
            );
          };
          insertTool(0);
        }
      );
    }
  );
});

// PUT /packages/admin/:id — update package
router.put('/admin/:id', authenticateToken, isAdminOrSubadmin, (req, res) => {
  const { name, description, category, rental_type, price_per_day, fixed_price, image_url, is_available, tools } = req.body;
  const packageId = req.params.id;

  db.get('SELECT * FROM packages WHERE id = ?', [packageId], (err, pkg) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (rental_type !== undefined) { updates.push('rental_type = ?'); params.push(rental_type); }
    if (price_per_day !== undefined) { updates.push('price_per_day = ?'); params.push(price_per_day || null); }
    if (fixed_price !== undefined) { updates.push('fixed_price = ?'); params.push(fixed_price || null); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (is_available !== undefined) { updates.push('is_available = ?'); params.push(is_available ? 1 : 0); }

    const doToolsUpdate = () => {
      if (!tools) {
        return getPackageWithTools(packageId, (err, updated) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          res.json({ message: 'Package updated', package: updated });
        });
      }
      // Validate tools
      const toolIds = tools.map(t => t.tool_id);
      const finalCategory = category || pkg.category;
      const finalRentalType = rental_type || pkg.rental_type;

      db.all(
        `SELECT id, name, rental_type, stock FROM tools WHERE id IN (${toolIds.map(() => '?').join(',')})`,
        toolIds,
        (err, dbTools) => {
          if (err) return res.status(500).json({ error: 'Server error' });

          for (const t of dbTools) {
            if (t.rental_type !== finalRentalType) {
              return res.status(400).json({ error: `All tools must have rental type "${finalRentalType}"` });
            }
            const requested = tools.find(rt => rt.tool_id === t.id);
            if (requested && requested.quantity > t.stock) {
              return res.status(400).json({ error: `"${t.name}": quantity (${requested.quantity}) exceeds stock (${t.stock})` });
            }
          }

          // Replace package tools
          db.run('DELETE FROM package_tools WHERE package_id = ?', [packageId], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update tools' });
            const insertTool = (index) => {
              if (index >= tools.length) {
                return getPackageWithTools(packageId, (err, updated) => {
                  if (err) return res.status(500).json({ error: 'Server error' });
                  res.json({ message: 'Package updated', package: updated });
                });
              }
              const { tool_id, quantity } = tools[index];
              db.run(
                'INSERT INTO package_tools (package_id, tool_id, quantity) VALUES (?, ?, ?)',
                [packageId, tool_id, quantity || 1],
                () => insertTool(index + 1)
              );
            };
            insertTool(0);
          });
        }
      );
    };

    if (updates.length === 0) return doToolsUpdate();

    params.push(packageId);
    db.run(`UPDATE packages SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update package' });
      doToolsUpdate();
    });
  });
});

// DELETE /packages/admin/:id — delete package
router.delete('/admin/:id', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.run('DELETE FROM packages WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete package' });
    if (this.changes === 0) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package deleted successfully' });
  });
});

// GET /packages/reservations/admin/all — all package reservations
router.get('/reservations/admin/all', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT pr.*, p.name as package_name, p.category, p.rental_type,
            u.name as user_name, u.email as user_email
     FROM package_reservations pr
     JOIN packages p ON pr.package_id = p.id
     JOIN users u ON pr.user_id = u.id
     WHERE pr.status != 'archived'
     ORDER BY pr.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch reservations' });
      res.json(rows);
    }
  );
});

// GET /packages/reservations/admin/by-tool/:toolId — package reservations that include a specific tool
router.get('/reservations/admin/by-tool/:toolId', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT pr.*, p.name as package_name, p.rental_type,
            u.name as user_name, u.email as user_email
     FROM package_reservations pr
     JOIN packages p ON pr.package_id = p.id
     JOIN package_tools pt ON pt.package_id = p.id
     JOIN users u ON pr.user_id = u.id
     WHERE pt.tool_id = ? AND pr.status != 'archived'
     ORDER BY pr.created_at DESC`,
    [req.params.toolId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch reservations' });
      res.json(rows);
    }
  );
});

// GET /packages/reservations/admin/archived — archived package reservations
router.get('/reservations/admin/archived', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.all(
    `SELECT pr.*, p.name as package_name, p.category, p.rental_type,
            u.name as user_name, u.email as user_email
     FROM package_reservations pr
     JOIN packages p ON pr.package_id = p.id
     JOIN users u ON pr.user_id = u.id
     WHERE pr.status = 'archived'
     ORDER BY pr.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch reservations' });
      res.json(rows);
    }
  );
});

// POST /packages/reservations/:id/deliver — mark delivered
router.post('/reservations/:id/deliver', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.run(
    "UPDATE package_reservations SET status = 'delivered' WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Marked as delivered' });
    }
  );
});

// POST /packages/reservations/:id/return — mark returned
router.post('/reservations/:id/return', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.run(
    "UPDATE package_reservations SET status = 'returned' WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Marked as returned' });
    }
  );
});

// POST /packages/reservations/:id/archive
router.post('/reservations/:id/archive', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.get('SELECT status FROM package_reservations WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    db.run(
      'UPDATE package_reservations SET status = ?, previous_status = ? WHERE id = ?',
      ['archived', row.status, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: 'Failed to archive' });
        res.json({ message: 'Archived' });
      }
    );
  });
});

// POST /packages/reservations/:id/restore
router.post('/reservations/:id/restore', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.get('SELECT previous_status FROM package_reservations WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    const status = row.previous_status || 'active';
    db.run(
      'UPDATE package_reservations SET status = ?, previous_status = NULL WHERE id = ?',
      [status, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: 'Failed to restore' });
        res.json({ message: 'Restored', status });
      }
    );
  });
});

// DELETE /packages/reservations/:id/permanent — permanently delete
router.delete('/reservations/:id/permanent', authenticateToken, isAdminOrSubadmin, (req, res) => {
  db.run('DELETE FROM package_reservations WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Permanently deleted' });
  });
});

module.exports = router;
