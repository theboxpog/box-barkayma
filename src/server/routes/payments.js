const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  const { reservation_id, amount } = req.body;
  const user_id = req.user.id;

  if (!reservation_id || !amount) {
    return res.status(400).json({ error: 'Reservation ID and amount required' });
  }

  // Verify reservation belongs to user
  db.get(
    'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
    [reservation_id, user_id],
    async (err, reservation) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // DEMO MODE: Skip Stripe and create a mock payment intent
      const mockPaymentIntentId = `pi_demo_${Date.now()}_${reservation_id}`;

      res.json({
        clientSecret: 'demo_client_secret',
        paymentIntentId: mockPaymentIntentId
      });
    }
  );
});

// Confirm payment (after Stripe confirms on client side)
router.post('/confirm', authenticateToken, async (req, res) => {
  const { payment_intent_id, reservation_id } = req.body;
  const user_id = req.user.id;

  if (!payment_intent_id || !reservation_id) {
    return res.status(400).json({ error: 'Payment intent ID and reservation ID required' });
  }

  // DEMO MODE: Skip Stripe validation and directly record payment
  // Get reservation to find the amount
  db.get(
    'SELECT total_price FROM reservations WHERE id = ? AND user_id = ?',
    [reservation_id, user_id],
    (err, reservation) => {
      if (err || !reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const amount = reservation.total_price;

      // Record payment in database
      db.run(
        'INSERT INTO payments (reservation_id, user_id, amount, success, stripe_payment_id) VALUES (?, ?, ?, ?, ?)',
        [reservation_id, user_id, amount, 1, payment_intent_id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to record payment' });
          }

          res.json({
            message: 'Payment confirmed successfully',
            payment: {
              id: this.lastID,
              reservation_id,
              amount,
              success: true
            }
          });
        }
      );
    }
  );
});

// Webhook for Stripe events (for production)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { reservation_id, user_id } = paymentIntent.metadata;

    // Record successful payment
    db.run(
      'INSERT INTO payments (reservation_id, user_id, amount, success, stripe_payment_id) VALUES (?, ?, ?, ?, ?)',
      [reservation_id, user_id, paymentIntent.amount / 100, 1, paymentIntent.id],
      (err) => {
        if (err) {
          console.error('Failed to record payment:', err);
        }
      }
    );
  }

  res.json({ received: true });
});

// Get user's payment history
router.get('/history', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT p.*, r.start_date, r.end_date, r.status as reservation_status,
            t.name as tool_name, t.category
     FROM payments p
     JOIN reservations r ON p.reservation_id = r.id
     JOIN tools t ON r.tool_id = t.id
     WHERE p.user_id = ?
     ORDER BY p.timestamp DESC`,
    [userId],
    (err, payments) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch payment history' });
      }
      res.json(payments);
    }
  );
});

// Get payment for specific reservation
router.get('/reservation/:reservationId', authenticateToken, (req, res) => {
  const reservationId = req.params.reservationId;
  const userId = req.user.id;

  db.get(
    `SELECT p.* FROM payments p
     JOIN reservations r ON p.reservation_id = r.id
     WHERE p.reservation_id = ? AND r.user_id = ?`,
    [reservationId, userId],
    (err, payment) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      res.json(payment);
    }
  );
});

module.exports = router;
