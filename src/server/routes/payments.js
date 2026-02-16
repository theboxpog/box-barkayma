const express = require('express');
const axios = require('axios');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Sumit API configuration
const SUMIT_API_URL = 'https://api.sumit.co.il/billing/payments/charge/';
const SUMIT_COMPANY_ID = process.env.SUMIT_COMPANY_ID;
const SUMIT_PRIVATE_KEY = process.env.SUMIT_PRIVATE_KEY;

// Get Sumit configuration for client
router.get('/sumit-config', (req, res) => {
  res.json({
    companyId: process.env.SUMIT_COMPANY_ID,
    publicKey: process.env.SUMIT_PUBLIC_KEY
  });
});

// Create payment intent (for backward compatibility)
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

      // Return a placeholder - actual payment will be done with Sumit token
      const paymentIntentId = `sumit_pending_${Date.now()}_${reservation_id}`;

      res.json({
        paymentIntentId: paymentIntentId,
        requiresSumitToken: true
      });
    }
  );
});

// Charge with Sumit token
router.post('/sumit-charge', authenticateToken, async (req, res) => {
  const { token, amount, description, reservationIds, customerName, customerEmail, customerPhone, customerIdNumber } = req.body;
  const user_id = req.user.id;

  if (!token || !amount) {
    return res.status(400).json({ error: 'Token and amount are required' });
  }

  try {
    // Build the charge request - Sumit API format
    // UnitPrice must be OUTSIDE the Item object, at the same level as Quantity
    const chargeRequest = {
      Credentials: {
        CompanyID: parseInt(SUMIT_COMPANY_ID),
        APIKey: SUMIT_PRIVATE_KEY
      },
      SingleUseToken: token,
      Items: [
        {
          Item: {
            ExternalIdentifier: '1',
            Name: description || 'Tool Rental',
            SKU: 'RENTAL',
            SearchMode: 'Automatic'
          },
          Quantity: 1,
          UnitPrice: parseFloat(amount.toFixed(2)),
          Currency: 'ILS'
        }
      ],
      Customer: {
        Name: customerName || req.user.name || 'Customer',
        Email: customerEmail || req.user.email || '',
        Phone: customerPhone || '',
        IdentityNumber: customerIdNumber || ''
      }
    };

    // Call Sumit API to charge the card
    const sumitResponse = await axios.post(SUMIT_API_URL, chargeRequest, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Check if Sumit returned success with a REAL PaymentId
    // Status === 0 means success, PaymentId is at Data.Payment.ID
    const sumitPaymentId = sumitResponse.data?.Data?.Payment?.ID;
    const isValidPayment = sumitResponse.data?.Data?.Payment?.ValidPayment;

    const isRealSuccess = sumitResponse.data &&
                          sumitResponse.data.Status === 0 &&
                          sumitPaymentId &&
                          isValidPayment === true;


    if (isRealSuccess) {
      // Payment successful with real PaymentId - record in database
      // Record payment for each reservation
      if (reservationIds && reservationIds.length > 0) {
        for (const reservationId of reservationIds) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO payments (reservation_id, user_id, amount, success, stripe_payment_id) VALUES (?, ?, ?, ?, ?)',
              [reservationId, user_id, amount / reservationIds.length, 1, String(sumitPaymentId)],
              function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          });
        }
      }

      res.json({
        success: true,
        message: 'Payment successful',
        paymentId: String(sumitPaymentId),
        sumitResponse: sumitResponse.data
      });
    } else {
      // Payment failed or no valid PaymentId returned
      const errorMessage = sumitResponse.data?.UserErrorMessage ||
                          sumitResponse.data?.TechnicalErrorMessage ||
                          (sumitResponse.data?.Status === 0 ? 'Payment not confirmed by processor' : 'Payment failed');
      res.status(400).json({
        success: false,
        error: errorMessage,
        sumitResponse: sumitResponse.data
      });
    }
  } catch (error) {
    console.error('Sumit payment error:', error.message);

    // Sumit might return error with Status !== 0
    const sumitData = error.response?.data;
    const errorMessage = sumitData?.UserErrorMessage ||
                        sumitData?.TechnicalErrorMessage ||
                        error.message ||
                        'Payment processing failed';

    res.status(400).json({
      success: false,
      error: errorMessage,
      sumitResponse: sumitData
    });
  }
});

// Confirm payment (for backward compatibility - now used after Sumit charge)
router.post('/confirm', authenticateToken, async (req, res) => {
  const { payment_intent_id, reservation_id } = req.body;
  const user_id = req.user.id;

  if (!payment_intent_id || !reservation_id) {
    return res.status(400).json({ error: 'Payment intent ID and reservation ID required' });
  }

  // Get reservation to find the amount
  db.get(
    'SELECT total_price FROM reservations WHERE id = ? AND user_id = ?',
    [reservation_id, user_id],
    (err, reservation) => {
      if (err || !reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const amount = reservation.total_price;

      // Check if payment already recorded
      db.get(
        'SELECT id FROM payments WHERE reservation_id = ?',
        [reservation_id],
        (err, existingPayment) => {
          if (existingPayment) {
            return res.json({
              message: 'Payment already recorded',
              payment: {
                id: existingPayment.id,
                reservation_id,
                amount,
                success: true
              }
            });
          }

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
    }
  );
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
