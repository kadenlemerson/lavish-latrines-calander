const express = require('express');
const { Client, Environment } = require('square');

const router = express.Router();

function getSquareClient() {
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox
  });
}

// POST /api/payments/create - process deposit payment
router.post('/create', async (req, res) => {
  const { sourceId, amount, customerEmail, customerName, bookingDate } = req.body;

  if (!sourceId || !amount) {
    return res.status(400).json({ error: 'Payment token and amount required' });
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return res.status(503).json({
      error: 'Payment processing not configured. Please contact us to complete your booking.'
    });
  }

  try {
    const client = getSquareClient();
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(Number(amount) * 100)), // must be whole cents
        currency: 'USD'
      },
      locationId: process.env.SQUARE_LOCATION_ID || '',
      buyerEmailAddress: customerEmail || undefined,
      note: `Lavish Latrines deposit - ${bookingDate || 'booking'} - ${customerName || ''}`
    });

    const payment = response.result.payment;
    res.json({
      paymentId: payment.id,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
      amount: Number(payment.amountMoney.amount) / 100
    });
  } catch (err) {
    console.error('Square payment error:', err);
    const message = err.errors?.[0]?.detail || err.message || 'Payment failed';
    res.status(402).json({ error: message });
  }
});

// GET /api/payments/config - return public Square config for frontend
router.get('/config', (req, res) => {
  const appId      = process.env.SQUARE_APP_ID      || '';
  const locationId = process.env.SQUARE_LOCATION_ID || '';
  const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  const configured = !!(appId && locationId);

  const missingVars = [];
  if (!appId)      missingVars.push('SQUARE_APP_ID');
  if (!locationId) missingVars.push('SQUARE_LOCATION_ID');

  res.json({
    appId,
    locationId,
    environment,
    configured,
    missingVars: missingVars.length ? missingVars : undefined
  });
});

module.exports = router;
