const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff, authenticate } = require('../middleware/auth');
const { sendBookingConfirmation, sendAdminBookingNotification } = require('../utils/email');
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
    const booked = await db.all(`
      SELECT event_date, COUNT(*) as count
      FROM bookings
      WHERE event_date BETWEEN ? AND ? AND status != 'cancelled'
      GROUP BY event_date
    `, [`${year}-${mo}-01`, `${year}-${mo}-31`]);

    const availability = {};
    booked.forEach(r => {
      availability[r.event_date] = {
        booked: r.count, available: Math.max(0, 2 - r.count), blocked: r.count >= 2
      };
    });
    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/availability?date=YYYY-MM-DD — public, single-date check
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date parameter required (YYYY-MM-DD)' });
    }
    const db = getDb();
    const row = await db.get(
      "SELECT COUNT(*) as count FROM bookings WHERE event_date = ? AND status != 'cancelled'",
      [date]
    );
    res.json({ date, booked: row.count, available: row.count < 2 });
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
      FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE 1=1`;
    const params = [];
    if (status)     { sql += ' AND b.status = ?';                        params.push(status); }
    if (month)      { sql += " AND strftime('%Y-%m', b.event_date) = ?"; params.push(month); }
    if (customerId) { sql += ' AND b.customer_id = ?';                   params.push(customerId); }
    sql += ' ORDER BY b.event_date DESC';
    res.json(await db.all(sql, params));
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
      FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE b.id = ?
    `, [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Shared booking creation logic ────────────────────────────────────────────

async function createBooking(fields, skipPaymentCheck = false) {
  const {
    customerName, customerEmail, customerPhone,
    customerAddress, customerCity, customerState, customerZip,
    eventDate, endDate, eventType, location, locationAddress, addressDetails,
    trailerNumber, notes, squarePaymentId, signatureData, depositAmount,
    waterAccess, powerAccess, expectedGuests, depositPaid, paymentStatus,
    createdByAdmin = 0
  } = fields;

  const db = getDb();

  // Availability check
  const bookedCount = await db.get(`
    SELECT COUNT(*) as count FROM bookings WHERE event_date = ? AND status != 'cancelled'
  `, [eventDate]);
  if (bookedCount.count >= 2) throw { status: 409, message: 'This date is fully booked.' };

  // Require payment for public bookings when Square is configured
  if (!skipPaymentCheck && process.env.SQUARE_ACCESS_TOKEN && !squarePaymentId) {
    throw { status: 402, message: 'Payment is required to confirm this booking.' };
  }

  // Assign trailer
  let assignedTrailer = trailerNumber;
  if (!assignedTrailer) {
    const booked = await db.all(
      "SELECT trailer_number FROM bookings WHERE event_date = ? AND status != 'cancelled'",
      [eventDate]
    );
    const taken = booked.map(b => b.trailer_number);
    assignedTrailer = taken.includes(1) ? 2 : 1;
  }

  // Find or create customer
  let customer = await db.get('SELECT * FROM customers WHERE email = ?', [customerEmail.toLowerCase().trim()]);
  if (!customer) {
    const r = await db.run(`
      INSERT INTO customers (name, email, phone, address, city, state, zip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customerName.trim(), customerEmail.toLowerCase().trim(),
        customerPhone || '', customerAddress || '',
        customerCity || '', customerState || '', customerZip || '']);
    customer = await db.get('SELECT * FROM customers WHERE id = ?', [r.lastInsertRowid]);
  }

  const basePrice   = 1100.00;
  const deposit     = parseFloat(depositAmount) || 550.00;
  const balance     = basePrice - deposit;
  const isPaid      = depositPaid !== undefined ? (depositPaid ? 1 : 0) : (squarePaymentId ? 1 : 0);
  const pStatus     = paymentStatus || (squarePaymentId ? 'paid' : 'pending');
  const signed      = signatureData ? 1 : 0;
  const signedAt    = signatureData ? new Date().toISOString() : null;

  const r = await db.run(`
    INSERT INTO bookings (
      customer_id, trailer_number, event_date, end_date, event_type,
      location, location_address, address_details, base_price, deposit_amount,
      deposit_paid, balance_due, square_payment_id, payment_status,
      contract_signed, signature_data, signed_at, notes, status,
      water_access, power_access, expected_guests, created_by_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    customer.id, assignedTrailer, eventDate, endDate || null, eventType || '',
    location || '', locationAddress || '', addressDetails || '',
    basePrice, deposit, isPaid, balance, squarePaymentId || null, pStatus,
    signed, signatureData || null, signedAt, notes || '', 'confirmed',
    waterAccess || '', powerAccess || '', expectedGuests || '', createdByAdmin
  ]);

  const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [r.lastInsertRowid]);
  return { booking, customer };
}

// POST /api/bookings — public (requires payment if Square configured)
router.post('/', async (req, res) => {
  try {
    const { booking, customer } = await createBooking(req.body, false);

    // Invoice + customer email
    try {
      const invoicePath = await generateInvoicePDF(booking, customer);
      await sendBookingConfirmation(booking, customer, invoicePath);
      await getDb().run('UPDATE bookings SET invoice_sent = 1 WHERE id = ?', [booking.id]);
    } catch (e) { console.error('Email/invoice error:', e.message); }

    // Admin notification
    try { await sendAdminBookingNotification(booking, customer); }
    catch (e) { console.error('Admin notification error:', e.message); }

    res.status(201).json({ ...booking, customer_name: customer.name, customer_email: customer.email });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || err });
  }
});

// POST /api/bookings/admin — admin manual booking (no payment required)
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { booking, customer } = await createBooking({ ...req.body, createdByAdmin: 1 }, true);

    // Admin notification to themselves
    try { await sendAdminBookingNotification(booking, customer); }
    catch (e) { console.error('Admin notification error:', e.message); }

    res.status(201).json({ ...booking, customer_name: customer.name, customer_email: customer.email });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || err });
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
        status           = COALESCE(?, status),
        notes            = COALESCE(?, notes),
        deposit_paid     = COALESCE(?, deposit_paid),
        payment_status   = COALESCE(?, payment_status),
        location         = COALESCE(?, location),
        location_address = COALESCE(?, location_address),
        balance_due      = COALESCE(?, balance_due)
      WHERE id = ?
    `, [
      status || null, notes || null,
      depositPaid !== undefined ? (depositPaid ? 1 : 0) : null,
      paymentStatus || null, location || null, locationAddress || null,
      balanceDue || null, req.params.id
    ]);

    const updated = await db.get(`
      SELECT b.*, c.name as customer_name, c.email as customer_email
      FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE b.id = ?
    `, [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:id (cancel)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await getDb().run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
