const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list all staff (admin only)
router.get('/', requireAdmin, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// POST /api/users - create staff account (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), email.toLowerCase().trim(), hash, role === 'admin' ? 'admin' : 'employee');

  res.status(201).json({ id: result.lastInsertRowid, name, email, role: role || 'employee' });
});

// DELETE /api/users/:id (admin only, can't delete yourself)
router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
