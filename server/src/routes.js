const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

async function getPermissions(role) {
  const { rows } = await pool.query(
    `SELECT p.code FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
      WHERE r.name = $1`,
    [role]
  );
  return rows.map((r) => r.code);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.password_hash, u.is_active, u.pharmacy_id,
            r.name AS role, p.name AS pharmacy_name, p.status AS pharmacy_status
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN pharmacies p ON p.id = u.pharmacy_id
      WHERE u.email = $1`,
    [email.trim().toLowerCase()]
  );
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });
  if (!u.is_active) return res.status(403).json({ error: 'Account disabled' });
  if (u.pharmacy_id && u.pharmacy_status !== 'active')
    return res.status(403).json({ error: 'Pharmacy suspended' });

  const permissions = await getPermissions(u.role);
  const token = jwt.sign(
    { id: u.id, role: u.role, pharmacyId: u.pharmacy_id, permissions },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: u.id,
      name: u.full_name,
      role: u.role,
      pharmacyId: u.pharmacy_id,
      pharmacyName: u.pharmacy_name,
      permissions,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
