const express = require('express');
const { getDb } = require('../database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/revenue/summary
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const filterYear = req.query.year || new Date().getFullYear();

    const totals = await db.get(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status != 'cancelled' THEN base_price ELSE 0 END) as total_revenue,
        SUM(CASE WHEN deposit_paid = 1 AND status != 'cancelled' THEN deposit_amount ELSE 0 END) as deposits_collected,
        SUM(CASE WHEN deposit_paid = 1 AND status != 'cancelled' THEN balance_due ELSE 0 END) as balance_outstanding,
        COUNT(CASE WHEN status = 'confirmed'  THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled'  THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status = 'completed'  THEN 1 END) as completed_bookings
      FROM bookings
      WHERE strftime('%Y', event_date) = ?
    `, [String(filterYear)]);

    const byMonth = await db.all(`
      SELECT
        strftime('%Y-%m', event_date) as month,
        COUNT(*) as bookings,
        SUM(CASE WHEN status != 'cancelled' THEN base_price ELSE 0 END) as revenue,
        SUM(CASE WHEN deposit_paid = 1 AND status != 'cancelled' THEN deposit_amount ELSE 0 END) as deposits
      FROM bookings
      WHERE strftime('%Y', event_date) = ? AND status != 'cancelled'
      GROUP BY month
      ORDER BY month
    `, [String(filterYear)]);

    const upcomingBookings = await db.all(`
      SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.event_date >= date('now') AND b.status = 'confirmed'
      ORDER BY b.event_date ASC
      LIMIT 10
    `, []);

    res.json({ year: filterYear, totals, byMonth, upcomingBookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/revenue/calendar
router.get('/calendar', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { month } = req.query;

    let sql = `
      SELECT b.event_date, b.trailer_number, b.status, b.event_type, b.location,
             c.name as customer_name, c.phone as customer_phone
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.status != 'cancelled'
    `;
    const params = [];

    if (month) { sql += " AND strftime('%Y-%m', b.event_date) = ?"; params.push(month); }
    sql += ' ORDER BY b.event_date ASC';

    const bookings = await db.all(sql, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
