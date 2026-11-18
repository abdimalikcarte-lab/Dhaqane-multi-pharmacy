const express = require('express');
const pool = require('../db');
const logAction = require('../utils/audit');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();
const METHODS = ['cash', 'card', 'mobile_money'];

// Iib cusub. Qiimaha waxaa laga qaadaa database-ka, ma aha client-ka.
router.post('/', requirePermission('sales.create'), async (req, res) => {
  const { items, paymentMethod, customerName } = req.body;
  if (!METHODS.includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'No items' });

  // isku dar waxyaabaha isku mid ah, u kala saar id si looga fogaado deadlock
  const merged = {};
  for (const it of items) {
    const q = parseInt(it.qty);
    if (!it.medicineId || !(q > 0)) return res.status(400).json({ error: 'Invalid item' });
    merged[it.medicineId] = (merged[it.medicineId] || 0) + q;
  }
  const ids = Object.keys(merged).map(Number).sort((a, b) => a - b);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    const lines = [];
    for (const id of ids) {
      const m = await client.query(
        'SELECT name, price, stock_qty FROM medicines WHERE id = $1 AND pharmacy_id = $2 AND is_active FOR UPDATE',
        [id, req.pharmacyId]
      );
      if (!m.rows[0]) throw new Error('Medicine not found');
      if (m.rows[0].stock_qty < merged[id]) throw new Error(`Not enough stock for ${m.rows[0].name}`);
      const price = Number(m.rows[0].price);
      total += price * merged[id];
      lines.push({ id, qty: merged[id], price });
    }
    total = Math.round(total * 100) / 100;

    let customerId = null;
    if (customerName && customerName.trim()) {
      const c = await client.query(
        'INSERT INTO customers (pharmacy_id, name) VALUES ($1,$2) RETURNING id',
        [req.pharmacyId, customerName.trim()]
      );
      customerId = c.rows[0].id;
    }

    const sale = await client.query(
      `INSERT INTO sales (pharmacy_id, customer_id, cashier_id, payment_method, total)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
      [req.pharmacyId, customerId, req.user.id, paymentMethod, total]
    );
    for (const l of lines) {
      await client.query(
        'INSERT INTO sale_items (sale_id, medicine_id, qty, unit_price) VALUES ($1,$2,$3,$4)',
        [sale.rows[0].id, l.id, l.qty, l.price]
      );
      await client.query('UPDATE medicines SET stock_qty = stock_qty - $1 WHERE id = $2', [l.qty, l.id]);
    }
    await logAction(client, req, 'sale.create', { saleId: sale.rows[0].id, total });
    await client.query('COMMIT');
    res.status(201).json({ id: sale.rows[0].id, total });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.get('/', requirePermission('sales.view'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.total, s.payment_method, s.created_at,
            c.name AS customer, u.full_name AS cashier
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       JOIN users u ON u.id = s.cashier_id
      WHERE s.pharmacy_id = $1
      ORDER BY s.created_at DESC LIMIT 200`,
    [req.pharmacyId]
  );
  res.json(rows);
});

router.get('/:id', requirePermission('sales.view'), async (req, res) => {
  const sale = await pool.query('SELECT * FROM sales WHERE id = $1 AND pharmacy_id = $2', [req.params.id, req.pharmacyId]);
  if (!sale.rows[0]) return res.status(404).json({ error: 'Sale not found' });
  const items = await pool.query(
    `SELECT si.qty, si.unit_price, m.name
       FROM sale_items si JOIN medicines m ON m.id = si.medicine_id
      WHERE si.sale_id = $1`,
    [req.params.id]
  );
  res.json({ ...sale.rows[0], items: items.rows });
});

// PUT / DELETE ma jiraan. Trigger-ka database-ku wuu diidaa.
module.exports = router;
