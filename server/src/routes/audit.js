const express = require('express');
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', requirePermission('users.manage'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.full_name AS user_name
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.pharmacy_id = $1 ORDER BY a.created_at DESC LIMIT 200`,
    [req.pharmacyId]
  );
  res.json(rows);
});

module.exports = router;
