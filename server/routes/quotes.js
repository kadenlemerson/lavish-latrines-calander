const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff } = require('../middleware/auth');
const { sendQuoteConfirmation } = require('../utils/email');

const router = express.Router();

// POST /api/quotes - public quote request
router.post('/', async (req, res) => {
  const {
    name, email, phone, eventType, requestedStart, requestedEnd,
    numTrailers, location, estimatedGuests, notes
  } = req.body;

  if (!name || !email || !requestedStart) {
    return res.status(400).json({ error: 'Name, email, and start date required' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO quotes (name, email, phone, event_type, requested_start, requested_end,
      num_trailers, location, estimated_guests, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(), email.toLowerCase().trim(), phone || '',
    eventType || '', requestedStart, requestedEnd || null,
    numTrailers || 1, location || '', estimatedGuests || null, notes || ''
  );

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(result.lastInsertRowid);

  // Send acknowledgment email
  try {
    await sendQuoteConfirmation(quote);
  } catch (err) {
    console.error('Quote email error:', err.message);
  }

  res.status(201).json(quote);
});

// GET /api/quotes (staff+)
router.get('/', requireStaff, (req, res) => {
  const db = getDb();
  const { status } = req.query;

  let query = 'SELECT * FROM quotes WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC';

  const quotes = db.prepare(query).all(...params);
  res.json(quotes);
});

// GET /api/quotes/:id
router.get('/:id', requireStaff, (req, res) => {
  const db = getDb();
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.json(quote);
});

// PUT /api/quotes/:id (admin only - update status, add notes, set price)
router.put('/:id', requireAdmin, (req, res) => {
  const { status, adminNotes, estimatedPrice } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE quotes SET
      status = COALESCE(?, status),
      admin_notes = COALESCE(?, admin_notes),
      estimated_price = COALESCE(?, estimated_price)
    WHERE id = ?
  `).run(status || null, adminNotes || null, estimatedPrice || null, req.params.id);

  const updated = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/quotes/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Quote deleted' });
});

module.exports = router;
