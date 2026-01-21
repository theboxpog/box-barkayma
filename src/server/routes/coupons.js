const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Validate and apply coupon (public, authenticated users)
router.post('/validate', authenticateToken, (req, res) => {
  const { code, orderValue, cartItems } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  if (!orderValue || orderValue <= 0) {
    return res.status(400).json({ error: 'Valid order value is required' });
  }

  // Get coupon from database
  db.get(
    'SELECT * FROM coupons WHERE code = ? COLLATE NOCASE',
    [code],
    (err, coupon) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      if (!coupon) {
        return res.status(404).json({
          valid: false,
          error: 'Coupon code not found. Please check the code and try again.'
        });
      }

      // Validate coupon
      const today = new Date().toISOString().split('T')[0];

      // Check if active
      if (!coupon.is_active) {
        return res.status(400).json({
          valid: false,
          error: 'This coupon is no longer active'
        });
      }

      // Check expiry date
      if (coupon.expiry_date && coupon.expiry_date < today) {
        const expiryDate = new Date(coupon.expiry_date).toLocaleDateString();
        return res.status(400).json({
          valid: false,
          error: `This coupon expired on ${expiryDate}`
        });
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return res.status(400).json({
          valid: false,
          error: 'This coupon has reached its usage limit'
        });
      }

      // Check minimum order value
      if (orderValue < coupon.min_order_value) {
        return res.status(400).json({
          valid: false,
          error: `This coupon requires a minimum order of $${coupon.min_order_value}. Your current cart total is $${orderValue.toFixed(2)}.`
        });
      }

      // Calculate discount based on restrictions
      let applicableOrderValue = orderValue;
      let eligibleItemsInfo = null;

      // Check if coupon has category or tool restrictions
      if (coupon.allowed_categories || coupon.allowed_tools) {
        if (!cartItems || cartItems.length === 0) {
          return res.status(400).json({
            valid: false,
            error: 'Cart items are required for this coupon'
          });
        }

        // Filter eligible items
        let eligibleItems = cartItems;

        // Apply category restrictions
        if (coupon.allowed_categories) {
          const allowedCategories = coupon.allowed_categories.split(',').map(c => c.trim());
          eligibleItems = eligibleItems.filter(item =>
            allowedCategories.includes(item.category)
          );
        }

        // Apply tool restrictions (further filter if both restrictions exist)
        if (coupon.allowed_tools) {
          const allowedToolIds = coupon.allowed_tools.split(',').map(id => parseInt(id.trim()));
          eligibleItems = eligibleItems.filter(item =>
            allowedToolIds.includes(item.toolId)
          );
        }

        // Check if any items match the restrictions
        if (eligibleItems.length === 0) {
          // Need to fetch tool names if there are tool restrictions
          if (coupon.allowed_tools) {
            const allowedToolIds = coupon.allowed_tools.split(',').map(id => parseInt(id.trim()));
            const placeholders = allowedToolIds.map(() => '?').join(',');

            db.all(
              `SELECT id, name FROM tools WHERE id IN (${placeholders})`,
              allowedToolIds,
              (err, tools) => {
                let errorMsg = 'This coupon cannot be applied to items in your cart. ';

                if (coupon.allowed_categories && coupon.allowed_tools) {
                  // Both category and tool restrictions
                  const allowedCategories = coupon.allowed_categories.split(',').map(c => c.trim());
                  const toolNames = tools.map(t => t.name);
                  errorMsg += `This coupon is only valid for these tools: ${toolNames.join(', ')} (from categories: ${allowedCategories.join(', ')}).`;
                } else {
                  // Only tool restrictions
                  const toolNames = tools.map(t => t.name);
                  errorMsg += `This coupon is only valid for: ${toolNames.join(', ')}.`;
                }

                return res.status(400).json({
                  valid: false,
                  error: errorMsg
                });
              }
            );
            return; // Exit early since we're handling the response in the callback
          } else {
            // Only category restrictions (no tools)
            let errorMsg = 'This coupon cannot be applied to items in your cart. ';
            const allowedCategories = coupon.allowed_categories.split(',').map(c => c.trim());
            errorMsg += `This coupon is only valid for items in these categories: ${allowedCategories.join(', ')}.`;

            return res.status(400).json({
              valid: false,
              error: errorMsg
            });
          }
        }

        // Calculate subtotal of eligible items
        applicableOrderValue = eligibleItems.reduce((sum, item) => {
          // Assuming each item has a totalPrice or calculate it
          return sum + (item.totalPrice || 0);
        }, 0);

        // Get eligible item names
        const eligibleItemNames = eligibleItems.map(item => item.toolName || item.name || 'Unknown item');

        eligibleItemsInfo = {
          count: eligibleItems.length,
          totalItems: cartItems.length,
          eligibleValue: applicableOrderValue,
          eligibleItems: eligibleItemNames
        };
      }

      // Check minimum order value against applicable items
      if (applicableOrderValue < coupon.min_order_value) {
        return res.status(400).json({
          valid: false,
          error: `This coupon requires a minimum of $${coupon.min_order_value} in eligible items. Your eligible items total is $${applicableOrderValue.toFixed(2)}.`
        });
      }

      // Calculate discount on applicable items only
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (applicableOrderValue * coupon.discount_value) / 100;
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed applicable order value
      discountAmount = Math.min(discountAmount, applicableOrderValue);

      const finalPrice = Math.max(0, orderValue - discountAmount);

      // Create a message about which items the coupon applies to
      let appliedToMessage = null;
      if (eligibleItemsInfo && eligibleItemsInfo.eligibleItems) {
        if (eligibleItemsInfo.count === eligibleItemsInfo.totalItems) {
          appliedToMessage = `Coupon applied to all items in your cart.`;
        } else {
          appliedToMessage = `Coupon applied to ${eligibleItemsInfo.count} of ${eligibleItemsInfo.totalItems} items: ${eligibleItemsInfo.eligibleItems.join(', ')}.`;
        }
      }

      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value
        },
        originalPrice: orderValue,
        discountAmount: discountAmount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        eligibleItemsInfo: eligibleItemsInfo,
        appliedToMessage: appliedToMessage
      });
    }
  );
});

// Increment coupon usage (called when order is completed)
router.post('/:id/use', authenticateToken, (req, res) => {
  const couponId = req.params.id;

  db.run(
    'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
    [couponId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update coupon usage' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.json({ message: 'Coupon usage updated' });
    }
  );
});

// Admin: Get all coupons
router.get('/admin/all', authenticateToken, isAdmin, (req, res) => {
  db.all(
    'SELECT * FROM coupons ORDER BY created_at DESC',
    [],
    (err, coupons) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch coupons' });
      }
      res.json(coupons);
    }
  );
});

// Admin: Create new coupon
router.post('/admin', authenticateToken, isAdmin, (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    min_order_value,
    max_uses,
    expiry_date,
    is_active,
    allowed_categories,
    allowed_tools
  } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({
      error: 'Code, discount type, and discount value are required'
    });
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return res.status(400).json({
      error: 'Discount type must be "percentage" or "fixed"'
    });
  }

  if (discount_value <= 0) {
    return res.status(400).json({
      error: 'Discount value must be greater than 0'
    });
  }

  if (discount_type === 'percentage' && discount_value > 100) {
    return res.status(400).json({
      error: 'Percentage discount cannot exceed 100%'
    });
  }

  db.run(
    `INSERT INTO coupons
     (code, discount_type, discount_value, min_order_value, max_uses, expiry_date, is_active, allowed_categories, allowed_tools)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code.toUpperCase(),
      discount_type,
      discount_value,
      min_order_value || 0,
      max_uses || null,
      expiry_date || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      allowed_categories || null,
      allowed_tools || null
    ],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Coupon code already exists' });
        }
        return res.status(500).json({ error: 'Failed to create coupon' });
      }
      res.status(201).json({
        message: 'Coupon created successfully',
        coupon: {
          id: this.lastID,
          code: code.toUpperCase(),
          discount_type,
          discount_value,
          min_order_value: min_order_value || 0,
          max_uses: max_uses || null,
          expiry_date: expiry_date || null,
          is_active: is_active !== undefined ? is_active : true,
          allowed_categories: allowed_categories || null,
          allowed_tools: allowed_tools || null
        }
      });
    }
  );
});

// Admin: Update coupon
router.put('/admin/:id', authenticateToken, isAdmin, (req, res) => {
  const couponId = req.params.id;
  const {
    code,
    discount_type,
    discount_value,
    min_order_value,
    max_uses,
    expiry_date,
    is_active,
    allowed_categories,
    allowed_tools
  } = req.body;

  const updates = [];
  const params = [];

  if (code !== undefined) {
    updates.push('code = ?');
    params.push(code.toUpperCase());
  }
  if (discount_type !== undefined) {
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({
        error: 'Discount type must be "percentage" or "fixed"'
      });
    }
    updates.push('discount_type = ?');
    params.push(discount_type);
  }
  if (discount_value !== undefined) {
    if (discount_value <= 0) {
      return res.status(400).json({
        error: 'Discount value must be greater than 0'
      });
    }
    updates.push('discount_value = ?');
    params.push(discount_value);
  }
  if (min_order_value !== undefined) {
    updates.push('min_order_value = ?');
    params.push(min_order_value);
  }
  if (max_uses !== undefined) {
    updates.push('max_uses = ?');
    params.push(max_uses);
  }
  if (expiry_date !== undefined) {
    updates.push('expiry_date = ?');
    params.push(expiry_date);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }
  if (allowed_categories !== undefined) {
    updates.push('allowed_categories = ?');
    params.push(allowed_categories || null);
  }
  if (allowed_tools !== undefined) {
    updates.push('allowed_tools = ?');
    params.push(allowed_tools || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(couponId);

  db.run(
    `UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Coupon code already exists' });
        }
        return res.status(500).json({ error: 'Failed to update coupon' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.json({ message: 'Coupon updated successfully' });
    }
  );
});

// Admin: Delete coupon
router.delete('/admin/:id', authenticateToken, isAdmin, (req, res) => {
  const couponId = req.params.id;

  db.run('DELETE FROM coupons WHERE id = ?', [couponId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete coupon' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  });
});

module.exports = router;
