const express = require('express');
const { getDb } = require('../database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/revenue/summary - overall stats
router.get('/summary', requireAdmin, (req, res) => {
  const db = getDb();
  const { year } = req.query;
  const filterYear = year || new Date().getFullYear();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status != 'cancelled' THEN base_price ELSE 0 END) as total_revenue,
      SUM(CASE WHEN deposit_paid = 1 AND status != 'cancelled' THEN deposit_amount ELSE 0 END) as deposits_collected,
      SUM(CASE WHEN deposit_paid = 1 AND status != 'cancelled' THEN balance_due ELSE 0 END) as balance_outstanding,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
    FROM bookings
    WHERE strftime('%Y', event_date) = ?
  `).get(String(filterYear));

  const byMonth = db.prepare(`
    SELECT
      strftime('%Y-%m', event_date) as month,
      COUNT(*) as bookings,
      SUM(CASE WHEN status != 'cancelled' THEN base_price ELSE 0 END) as revenue,
      SUM(CASE WHEN deposit_paid = 1 AND status != 'cancelled' THEN deposit_amount ELSE 0 END) as deposits
    FROM bookings
    WHERE strftime('%Y', event_date) = ? AND status != 'cancelled'
    GROUP BY month
    ORDER BY month
  `).all(String(filterYear));

  const upcomingBookings = db.prepare(`
    SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.event_date >= date('now') AND b.status = 'confirmed'
    ORDER BY b.event_date ASC
    LIMIT 10
  `).all();

  res.json({
    year: filterYear,
    totals,
    byMonth,
    upcomingBookings
  });
});

// GET /api/revenue/calendar - bookings by date for calendar view
router.get('/calendar', requireAdmin, (req, res) => {
  const db = getDb();
  const { month } = req.query;

  let query = `
    SELECT b.event_date, b.trailer_number, b.status, b.event_type, b.location,
           c.name as customer_name, c.phone as customer_phone
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.status != 'cancelled'
  `;
  const params = [];

  if (month) {
    query += ' AND strftime("%Y-%m", b.event_date) = ?';
    params.push(month);
  }

  query += ' ORDER BY b.event_date ASC';
  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

module.exports = router;
