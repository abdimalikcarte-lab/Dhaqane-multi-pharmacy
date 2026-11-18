const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const id = req.pharmacyId;
  const [totals, daily, low, recent, meds] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(total),0) AS sales_total, COUNT(*) AS sales_count
         FROM sales WHERE pharmacy_id = $1 AND created_at >= now() - interval '30 days'`, [id]),
    pool.query(
      `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, SUM(total) AS total
         FROM sales WHERE pharmacy_id = $1 AND created_at >= now() - interval '30 days'
        GROUP BY 1 ORDER BY 1`, [id]),
    pool.query(
      `SELECT id, name, stock_qty, reorder_level FROM medicines
        WHERE pharmacy_id = $1 AND is_active AND stock_qty <= reorder_level
        ORDER BY stock_qty LIMIT 8`, [id]),
    pool.query(
      `SELECT s.id, s.total, s.payment_method, s.created_at, c.name AS customer
         FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
        WHERE s.pharmacy_id = $1 ORDER BY s.created_at DESC LIMIT 5`, [id]),
    pool.query('SELECT COUNT(*) AS n FROM medicines WHERE pharmacy_id = $1 AND is_active', [id]),
  ]);
  res.json({
    salesTotal: Number(totals.rows[0].sales_total),
    salesCount: Number(totals.rows[0].sales_count),
    medicinesCount: Number(meds.rows[0].n),
    daily: daily.rows,
    lowStock: low.rows,
    recentSales: recent.rows,
  });
});

module.exports = router;
