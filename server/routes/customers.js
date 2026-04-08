const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers
router.get('/', requireStaff, (req, res) => {
  const db = getDb();
  const { search } = req.query;

  let query = `
    SELECT c.*,
      COUNT(b.id) as total_bookings,
      SUM(CASE WHEN b.status != 'cancelled' THEN b.base_price ELSE 0 END) as total_revenue,
      SUM(CASE WHEN b.deposit_paid = 1 AND b.status != 'cancelled' THEN b.deposit_amount ELSE 0 END) as total_paid,
      MAX(b.event_date) as last_booking_date
    FROM customers c
    LEFT JOIN bookings b ON c.id = b.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' GROUP BY c.id ORDER BY c.created_at DESC';

  const customers = db.prepare(query).all(...params);
  res.json(customers);
});

// GET /api/customers/:id
router.get('/:id', requireStaff, (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const bookings = db.prepare(`
    SELECT * FROM bookings WHERE customer_id = ? ORDER BY event_date DESC
  `).all(req.params.id);

  res.json({ ...customer, bookings });
});

// PUT /api/customers/:id (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const { name, email, phone, address, city, state, zip, notes } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE customers SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      zip = COALESCE(?, zip),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(name, email, phone, address, city, state, zip, notes, req.params.id);

  const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/customers/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Customer deleted' });
});

module.exports = router;
