const express = require('express');
const axios = require('axios');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Sumit API configuration
const SUMIT_API_URL = 'https://api.sumit.co.il/billing/payments/charge/';
const SUMIT_COMPANY_ID = process.env.SUMIT_COMPANY_ID;
const SUMIT_PRIVATE_KEY = process.env.SUMIT_PRIVATE_KEY;
const SUMIT_BEGINREDIRECT_URL = process.env.SUMIT_PROXY_URL || 'https://api.sumit.co.il/billing/payments/beginredirect/';

// Initialize SUMIT hosted payment page via BeginRedirect API
router.post('/bit-init', authenticateToken, async (req, res) => {
  const { amount, description, cartItems, customerName, customerEmail, customerPhone } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid amount is required' });
  }

  if (!SUMIT_COMPANY_ID || !SUMIT_PRIVATE_KEY) {
    console.error('SUMIT credentials missing from environment variables');
    return res.status(500).json({ success: false, error: 'Payment system not configured. Contact support.' });
  }

  const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'https://the-box.top';
  const identifier = `order_${Date.now()}_${req.user.id}`;
  const amountFixed = parseFloat(parseFloat(amount).toFixed(2));

  // Save payment session server-side so cart data is available after redirect
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO payment_sessions (identifier, user_id, cart_data, total_amount) VALUES (?, ?, ?, ?)',
        [identifier, req.user.id, JSON.stringify(cartItems || []), amountFixed],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });
  } catch (err) {
    console.error('Failed to save payment session:', err);
    return res.status(500).json({ success: false, error: 'Failed to initialize payment session.' });
  }

  const successUrl = `${frontendUrl}/checkout/payment-callback?status=success&id=${identifier}`;
  const failureUrl = `${frontendUrl}/checkout/payment-callback?status=failure`;

  // Call SUMIT BeginRedirect API (via proxy if SUMIT_PROXY_URL is set)
  try {
    const redirectRequest = {
      Credentials: {
        CompanyID: parseInt(SUMIT_COMPANY_ID),
        APIKey: SUMIT_PRIVATE_KEY
      },
      Items: [
        {
          Item: { ExternalIdentifier: '1', Name: description || 'The Box - Tool Rental', SKU: 'THEBOX', SearchMode: 'Automatic' },
          Quantity: 1,
          UnitPrice: amountFixed,
          Currency: 'ILS'
        }
      ],
      Customer: {
        Name: customerName || req.user.name || 'Customer',
        Email: customerEmail || req.user.email || '',
        Phone: customerPhone || ''
      },
      DocumentDescription: description || 'The Box - Tool Rental',
      SuccessRedirectUrl: successUrl,
      FailureRedirectUrl: failureUrl
    };

    console.log('Calling SUMIT via:', SUMIT_BEGINREDIRECT_URL);
    const sumitResponse = await axios.post(SUMIT_BEGINREDIRECT_URL, redirectRequest, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('SUMIT raw response:', JSON.stringify(sumitResponse.data).substring(0, 500));
    const data = sumitResponse.data;
    const redirectUrl = data?.Data?.RedirectURL || data?.Data?.RedirectUrl || data?.Data?.Url;

    if (data?.Status === 0 && redirectUrl) {
      res.json({ success: true, redirectUrl, identifier });
    } else {
      const errorMsg = data?.UserErrorMessage || data?.TechnicalErrorMessage ||
                       `SUMIT error (status ${data?.Status}): ${JSON.stringify(data?.Data)}`;
      console.error('SUMIT beginredirect failed:', errorMsg);
      res.status(400).json({ success: false, error: errorMsg });
    }
  } catch (error) {
    const sumitData = error.response?.data;
    const errorMsg = (typeof sumitData === 'object' && sumitData?.UserErrorMessage) ||
                     (typeof sumitData === 'object' && sumitData?.TechnicalErrorMessage) ||
                     error.message || 'Failed to initialize payment';
    console.error('SUMIT beginredirect error:', error.message);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// Get Sumit configuration for client-side beginredirect call
router.get('/sumit-config', (req, res) => {
  res.json({
    companyId: process.env.SUMIT_COMPANY_ID,
    apiKey: process.env.SUMIT_PRIVATE_KEY
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
            Name: description || 'The Box',
            SKU: 'THEBOX',
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
        IdentityNumber: customerIdNumber || '',
        SendDocumentByEmail: true
      },
      SendDocumentByEmail: true,
      DocumentDescription: description || 'The Box'
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

// Diagnostic route — tests SUMIT API directly, logs full raw response
router.get('/test-sumit', async (req, res) => {
  const results = [];

  const endpoints = [
    'https://api.sumit.co.il/billing/payments/beginredirect/',
    'https://api.sumit.co.il/api/v0.1/Payment/BeginRedirect'
  ];

  for (const url of endpoints) {
    try {
      const response = await axios({
        method: 'post',
        url,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        data: {
          Credentials: {
            CompanyID: parseInt(SUMIT_COMPANY_ID),
            APIKey: SUMIT_PRIVATE_KEY
          },
          Items: [{ Item: { ExternalIdentifier: '1', Name: 'Test', SKU: 'TEST', SearchMode: 'Automatic' }, Quantity: 1, UnitPrice: 1, Currency: 'ILS' }],
          Customer: { Name: 'Test', Email: 'test@test.com', Phone: '0500000000' },
          DocumentDescription: 'Test',
          SuccessRedirectUrl: 'https://the-box.top/checkout/payment-callback?status=success',
          FailureRedirectUrl: 'https://the-box.top/checkout/payment-callback?status=failure'
        },
        validateStatus: () => true
      });

      results.push({
        url,
        status: response.status,
        isHtml: typeof response.data === 'string' && response.data.includes('Human Verification'),
        data: response.data
      });
    } catch (err) {
      results.push({ url, error: err.message });
    }
  }

  res.json(results);
});

// Complete a payment session — creates reservations from server-stored cart data.
// The identifier is one-time use and tied to the authenticated user, so this is safe
// to expose as a manual trigger (e.g. when SUMIT doesn't redirect to localhost in dev).
router.post('/complete', authenticateToken, async (req, res) => {
  const { identifier } = req.body;
  const user_id = req.user.id;

  if (!identifier) {
    return res.status(400).json({ error: 'Payment identifier is required.' });
  }

  try {
    // Find the pending session for this user
    const session = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM payment_sessions WHERE identifier = ? AND user_id = ? AND status = ?',
        [identifier, user_id, 'pending'],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });

    if (!session) {
      return res.status(404).json({ error: 'Payment session not found, already processed, or does not belong to this account.' });
    }

    const cartItems = JSON.parse(session.cart_data || '[]');
    if (!cartItems.length) {
      return res.status(400).json({ error: 'No items in payment session.' });
    }

    // Mark as completed first to prevent duplicate processing
    await new Promise((resolve, reject) => {
      db.run('UPDATE payment_sessions SET status = ? WHERE identifier = ?', ['completed', identifier],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });

    // Create reservations from the server-stored cart data
    const createdReservations = [];
    for (const item of cartItems) {
      const reservationId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO reservations (user_id, tool_id, start_date, end_date, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user_id, item.toolId, item.startDate, item.endDate, item.quantity || 1, item.totalPrice, 'active'],
          function (err) { if (err) reject(err); else resolve(this.lastID); }
        );
      });
      createdReservations.push({
        id: reservationId,
        user_id,
        tool_id: item.toolId,
        start_date: item.startDate,
        end_date: item.endDate,
        quantity: item.quantity || 1,
        total_price: item.totalPrice,
        status: 'active'
      });
    }

    res.json({
      success: true,
      reservations: createdReservations,
      orderCount: createdReservations.length,
      totalAmount: session.total_amount
    });

  } catch (error) {
    console.error('Error completing payment session:', error);
    res.status(500).json({ error: 'Failed to create reservations.' });
  }
});

module.exports = router;
