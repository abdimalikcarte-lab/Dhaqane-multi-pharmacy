const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requirePermission('pharmacies.manage'));

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM pharmacies ORDER BY id');
  res.json(rows);
});

// Abuur pharmacy + admin-kiisa
router.post('/', async (req, res) => {
  const { name, address, phone, adminName, adminEmail, adminPassword } = req.body;
  if (!name || !adminName || !adminEmail || !adminPassword || adminPassword.length < 8)
    return res.status(400).json({ error: 'Name, admin name, email and a password of 8+ characters are required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ph = await client.query(
      'INSERT INTO pharmacies (name, address, phone) VALUES ($1,$2,$3) RETURNING *',
      [name.trim(), address || null, phone || null]
    );
    const hash = await bcrypt.hash(adminPassword, 10);
    await client.query(
      `INSERT INTO users (pharmacy_id, role_id, full_name, email, password_hash)
       VALUES ($1, (SELECT id FROM roles WHERE name = 'admin'), $2, $3, $4)`,
      [ph.rows[0].id, adminName.trim(), adminEmail.trim().toLowerCase(), hash]
    );
    await client.query('COMMIT');
    res.status(201).json(ph.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.code === '23505' ? 'Email already in use' : e.message });
  } finally {
    client.release();
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  const r = await pool.query('UPDATE pharmacies SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ updated: r.rowCount });
});

module.exports = router;
