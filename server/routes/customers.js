const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers
router.get('/', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const { search } = req.query;

    let sql = `
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
      sql += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const customers = await db.all(sql, params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const bookings = await db.all(
      'SELECT * FROM bookings WHERE customer_id = ? ORDER BY event_date DESC',
      [req.params.id]
    );

    res.json({ ...customer, bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, city, state, zip, notes } = req.body;
    const db = getDb();

    await db.run(`
      UPDATE customers SET
        name    = COALESCE(?, name),
        email   = COALESCE(?, email),
        phone   = COALESCE(?, phone),
        address = COALESCE(?, address),
        city    = COALESCE(?, city),
        state   = COALESCE(?, state),
        zip     = COALESCE(?, zip),
        notes   = COALESCE(?, notes)
      WHERE id = ?
    `, [name, email, phone, address, city, state, zip, notes, req.params.id]);

    const updated = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
