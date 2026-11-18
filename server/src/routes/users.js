const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const logAction = require('../utils/audit');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requirePermission('users.manage'));

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.is_active, r.name AS role, u.created_at
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.pharmacy_id = $1 ORDER BY u.id`,
    [req.pharmacyId]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password || password.length < 8)
    return res.status(400).json({ error: 'Name, email and a password of 8+ characters are required' });
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (pharmacy_id, role_id, full_name, email, password_hash)
       VALUES ($1, (SELECT id FROM roles WHERE name = $2), $3, $4, $5)`,
      [req.pharmacyId, role, fullName.trim(), email.trim().toLowerCase(), hash]
    );
    await logAction(pool, req, 'user.create', { email, role });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.code === '23505' ? 'Email already in use' : e.message });
  }
});

router.patch('/:id/active', async (req, res) => {
  if (+req.params.id === req.user.id)
    return res.status(400).json({ error: 'You cannot disable yourself' });
  const r = await pool.query(
    'UPDATE users SET is_active = $1 WHERE id = $2 AND pharmacy_id = $3',
    [!!req.body.isActive, req.params.id, req.pharmacyId]
  );
  await logAction(pool, req, req.body.isActive ? 'user.enable' : 'user.disable', { userId: +req.params.id });
  res.json({ updated: r.rowCount });
});

router.patch('/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'Password must be 8+ characters' });
  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 AND pharmacy_id = $3',
    [hash, req.params.id, req.pharmacyId]
  );
  await logAction(pool, req, 'user.password_reset', { userId: +req.params.id });
  res.json({ updated: r.rowCount });
});

module.exports = router;
