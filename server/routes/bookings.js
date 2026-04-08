const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/email');
const { generateInvoicePDF } = require('../utils/invoice');

const router = express.Router();

// GET /api/bookings/available?month=YYYY-MM
// Returns available dates and how many trailer slots remain each day
router.get('/available', (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month parameter required (YYYY-MM)' });
  }

  const db = getDb();
  const [year, mo] = month.split('-');
  const startDate = `${year}-${mo}-01`;
  const endDate = `${year}-${mo}-31`;

  const booked = db.prepare(`
    SELECT event_date, COUNT(*) as count
    FROM bookings
    WHERE event_date BETWEEN ? AND ?
      AND status != 'cancelled'
    GROUP BY event_date
  `).all(startDate, endDate);

  const availability = {};
  booked.forEach(row => {
    availability[row.event_date] = {
      booked: row.count,
      available: Math.max(0, 2 - row.count),
      blocked: row.count >= 2
    };
  });

  res.json(availability);
});

// GET /api/bookings - all bookings (staff+)
router.get('/', requireStaff, (req, res) => {
  const db = getDb();
  const { status, month, customerId } = req.query;

  let query = `
    SELECT b.*, c.name as customer_name, c.email as customer_email,
           c.phone as customer_phone
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND b.status = ?'; params.push(status); }
  if (month) { query += ' AND strftime("%Y-%m", b.event_date) = ?'; params.push(month); }
  if (customerId) { query += ' AND b.customer_id = ?'; params.push(customerId); }

  query += ' ORDER BY b.event_date DESC';

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// GET /api/bookings/:id
router.get('/:id', requireStaff, (req, res) => {
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*, c.name as customer_name, c.email as customer_email,
           c.phone as customer_phone, c.address as customer_address
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// POST /api/bookings - create booking (public - after payment)
router.post('/', async (req, res) => {
  const {
    customerName, customerEmail, customerPhone, customerAddress,
    customerCity, customerState, customerZip,
    eventDate, endDate, eventType, location, locationAddress,
    trailerNumber, notes, squarePaymentId, signatureData, depositAmount
  } = req.body;

  if (!customerName || !customerEmail || !eventDate) {
    return res.status(400).json({ error: 'Customer name, email, and event date required' });
  }

  const db = getDb();

  // Check availability
  const bookedCount = db.prepare(`
    SELECT COUNT(*) as count FROM bookings
    WHERE event_date = ? AND status != 'cancelled'
  `).get(eventDate);

  if (bookedCount.count >= 2) {
    return res.status(409).json({ error: 'This date is fully booked. Please select another date.' });
  }

  // Determine trailer number
  let assignedTrailer = trailerNumber;
  if (!assignedTrailer) {
    const booked = db.prepare(`
      SELECT trailer_number FROM bookings
      WHERE event_date = ? AND status != 'cancelled'
    `).all(eventDate);
    const bookedNums = booked.map(b => b.trailer_number);
    assignedTrailer = bookedNums.includes(1) ? 2 : 1;
  }

  // Find or create customer
  let customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(customerEmail.toLowerCase().trim());
  if (!customer) {
    const result = db.prepare(`
      INSERT INTO customers (name, email, phone, address, city, state, zip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerName.trim(),
      customerEmail.toLowerCase().trim(),
      customerPhone || '',
      customerAddress || '',
      customerCity || '',
      customerState || '',
      customerZip || ''
    );
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  }

  const basePrice = 1100.00;
  const deposit = depositAmount || 550.00;
  const balance = basePrice - deposit;

  // Create booking
  const result = db.prepare(`
    INSERT INTO bookings (
      customer_id, trailer_number, event_date, end_date, event_type,
      location, location_address, base_price, deposit_amount, deposit_paid,
      balance_due, square_payment_id, payment_status, contract_signed,
      signature_data, signed_at, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer.id, assignedTrailer, eventDate, endDate || null,
    eventType || '', location || '', locationAddress || '',
    basePrice, deposit,
    squarePaymentId ? 1 : 0,
    balance,
    squarePaymentId || null,
    squarePaymentId ? 'paid' : 'pending',
    signatureData ? 1 : 0,
    signatureData || null,
    signatureData ? new Date().toISOString() : null,
    notes || '',
    'confirmed'
  );

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

  // Generate invoice & send confirmation email
  try {
    const invoicePath = await generateInvoicePDF(booking, customer);
    await sendBookingConfirmation(booking, customer, invoicePath);
    db.prepare('UPDATE bookings SET invoice_sent = 1 WHERE id = ?').run(booking.id);
  } catch (emailErr) {
    console.error('Email/invoice error (booking still created):', emailErr.message);
  }

  res.status(201).json({
    ...booking,
    customer_name: customer.name,
    customer_email: customer.email
  });
});

// PUT /api/bookings/:id (staff+ can update)
router.put('/:id', requireStaff, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const {
    status, notes, depositPaid, paymentStatus,
    location, locationAddress, balanceDue
  } = req.body;

  db.prepare(`
    UPDATE bookings SET
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      deposit_paid = COALESCE(?, deposit_paid),
      payment_status = COALESCE(?, payment_status),
      location = COALESCE(?, location),
      location_address = COALESCE(?, location_address),
      balance_due = COALESCE(?, balance_due)
    WHERE id = ?
  `).run(
    status || null, notes || null,
    depositPaid !== undefined ? (depositPaid ? 1 : 0) : null,
    paymentStatus || null,
    location || null, locationAddress || null,
    balanceDue || null,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT b.*, c.name as customer_name, c.email as customer_email
    FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /api/bookings/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  res.json({ message: 'Booking cancelled' });
});

module.exports = router;
