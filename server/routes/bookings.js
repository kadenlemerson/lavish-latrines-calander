const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/email');
const { generateInvoicePDF } = require('../utils/invoice');

const router = express.Router();

// GET /api/bookings/available?month=YYYY-MM
router.get('/available', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month parameter required (YYYY-MM)' });
    }

    const db = getDb();
    const [year, mo] = month.split('-');
    const startDate = `${year}-${mo}-01`;
    const endDate   = `${year}-${mo}-31`;

    const booked = await db.all(`
      SELECT event_date, COUNT(*) as count
      FROM bookings
      WHERE event_date BETWEEN ? AND ? AND status != 'cancelled'
      GROUP BY event_date
    `, [startDate, endDate]);

    const availability = {};
    booked.forEach(row => {
      availability[row.event_date] = {
        booked:    row.count,
        available: Math.max(0, 2 - row.count),
        blocked:   row.count >= 2
      };
    });

    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings
router.get('/', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const { status, month, customerId } = req.query;

    let sql = `
      SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status)     { sql += ' AND b.status = ?';                          params.push(status); }
    if (month)      { sql += " AND strftime('%Y-%m', b.event_date) = ?";   params.push(month); }
    if (customerId) { sql += ' AND b.customer_id = ?';                     params.push(customerId); }

    sql += ' ORDER BY b.event_date DESC';

    const bookings = await db.all(sql, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const booking = await db.get(`
      SELECT b.*, c.name as customer_name, c.email as customer_email,
             c.phone as customer_phone, c.address as customer_address
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings - public booking creation
router.post('/', async (req, res) => {
  try {
    const {
      customerName, customerEmail, customerPhone,
      customerAddress, customerCity, customerState, customerZip,
      eventDate, endDate, eventType, location, locationAddress,
      trailerNumber, notes, squarePaymentId, signatureData, depositAmount
    } = req.body;

    if (!customerName || !customerEmail || !eventDate) {
      return res.status(400).json({ error: 'Customer name, email, and event date required' });
    }

    const db = getDb();

    // Check availability
    const bookedCount = await db.get(`
      SELECT COUNT(*) as count FROM bookings
      WHERE event_date = ? AND status != 'cancelled'
    `, [eventDate]);

    if (bookedCount.count >= 2) {
      return res.status(409).json({ error: 'This date is fully booked. Please select another date.' });
    }

    // Assign trailer number
    let assignedTrailer = trailerNumber;
    if (!assignedTrailer) {
      const booked = await db.all(`
        SELECT trailer_number FROM bookings
        WHERE event_date = ? AND status != 'cancelled'
      `, [eventDate]);
      const bookedNums = booked.map(b => b.trailer_number);
      assignedTrailer = bookedNums.includes(1) ? 2 : 1;
    }

    // Find or create customer
    let customer = await db.get('SELECT * FROM customers WHERE email = ?', [customerEmail.toLowerCase().trim()]);
    if (!customer) {
      const result = await db.run(`
        INSERT INTO customers (name, email, phone, address, city, state, zip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        customerName.trim(), customerEmail.toLowerCase().trim(),
        customerPhone || '', customerAddress || '',
        customerCity || '', customerState || '', customerZip || ''
      ]);
      customer = await db.get('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid]);
    }

    const basePrice     = 1100.00;
    const deposit       = depositAmount || 550.00;
    const balance       = basePrice - deposit;
    const depositPaid   = squarePaymentId ? 1 : 0;
    const paymentStatus = squarePaymentId ? 'paid' : 'pending';
    const contractSigned = signatureData ? 1 : 0;
    const signedAt      = signatureData ? new Date().toISOString() : null;

    const result = await db.run(`
      INSERT INTO bookings (
        customer_id, trailer_number, event_date, end_date, event_type,
        location, location_address, base_price, deposit_amount, deposit_paid,
        balance_due, square_payment_id, payment_status, contract_signed,
        signature_data, signed_at, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer.id, assignedTrailer, eventDate, endDate || null,
      eventType || '', location || '', locationAddress || '',
      basePrice, deposit, depositPaid, balance,
      squarePaymentId || null, paymentStatus,
      contractSigned, signatureData || null, signedAt,
      notes || '', 'confirmed'
    ]);

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [result.lastInsertRowid]);

    // Generate invoice & send email
    try {
      const invoicePath = await generateInvoicePDF(booking, customer);
      await sendBookingConfirmation(booking, customer, invoicePath);
      await db.run('UPDATE bookings SET invoice_sent = 1 WHERE id = ?', [booking.id]);
    } catch (emailErr) {
      console.error('Email/invoice error (booking still created):', emailErr.message);
    }

    res.status(201).json({ ...booking, customer_name: customer.name, customer_email: customer.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id
router.put('/:id', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { status, notes, depositPaid, paymentStatus, location, locationAddress, balanceDue } = req.body;

    await db.run(`
      UPDATE bookings SET
        status         = COALESCE(?, status),
        notes          = COALESCE(?, notes),
        deposit_paid   = COALESCE(?, deposit_paid),
        payment_status = COALESCE(?, payment_status),
        location       = COALESCE(?, location),
        location_address = COALESCE(?, location_address),
        balance_due    = COALESCE(?, balance_due)
      WHERE id = ?
    `, [
      status      || null,
      notes       || null,
      depositPaid !== undefined ? (depositPaid ? 1 : 0) : null,
      paymentStatus || null,
      location    || null,
      locationAddress || null,
      balanceDue  || null,
      req.params.id
    ]);

    const updated = await db.get(`
      SELECT b.*, c.name as customer_name, c.email as customer_email
      FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `, [req.params.id]);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:id (cancel — admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
