const express = require('express');
const { getDb } = require('../database');
const { requireAdmin, requireStaff } = require('../middleware/auth');
const { sendQuoteConfirmation, sendAdminQuoteNotification } = require('../utils/email');

const router = express.Router();

// POST /api/quotes — public
router.post('/', async (req, res) => {
  try {
    const {
      name, email, phone, eventType, requestedStart, requestedEnd,
      numTrailers, location, estimatedGuests, notes,
      waterAccess, powerAccess, addressDetails
    } = req.body;

    if (!name || !email || !requestedStart) {
      return res.status(400).json({ error: 'Name, email, and start date required' });
    }

    const db = getDb();
    const result = await db.run(`
      INSERT INTO quotes (name, email, phone, event_type, requested_start, requested_end,
        num_trailers, location, estimated_guests, notes, water_access, power_access, address_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(), email.toLowerCase().trim(), phone || '',
      eventType || '', requestedStart, requestedEnd || null,
      numTrailers || 1, location || '', estimatedGuests || null, notes || '',
      waterAccess || '', powerAccess || '', addressDetails || ''
    ]);

    const quote = await db.get('SELECT * FROM quotes WHERE id = ?', [result.lastInsertRowid]);

    try { await sendQuoteConfirmation(quote); }
    catch (e) { console.error('Quote customer email error:', e.message); }

    try { await sendAdminQuoteNotification(quote); }
    catch (e) { console.error('Admin quote notification error:', e.message); }

    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quotes
router.get('/', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let sql = 'SELECT * FROM quotes WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    res.json(await db.all(sql, params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quotes/:id
router.get('/:id', requireStaff, async (req, res) => {
  try {
    const db = getDb();
    const quote = await db.get('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/quotes/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, estimatedPrice } = req.body;
    const db = getDb();
    await db.run(`
      UPDATE quotes SET
        status          = COALESCE(?, status),
        admin_notes     = COALESCE(?, admin_notes),
        estimated_price = COALESCE(?, estimated_price)
      WHERE id = ?
    `, [status || null, adminNotes || null, estimatedPrice || null, req.params.id]);
    res.json(await db.get('SELECT * FROM quotes WHERE id = ?', [req.params.id]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quotes/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await getDb().run('DELETE FROM quotes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Quote deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
