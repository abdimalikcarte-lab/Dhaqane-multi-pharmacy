const express = require('express');
const pool = require('../db');
const logAction = require('../utils/audit');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

/* ---------- categories ---------- */
router.get('/categories', requirePermission('medicines.view'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE pharmacy_id = $1 ORDER BY name',
    [req.pharmacyId]
  );
  res.json(rows);
});

router.post('/categories', requirePermission('medicines.create'), async (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name is required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (pharmacy_id, name) VALUES ($1,$2) RETURNING *',
      [req.pharmacyId, req.body.name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.code === '23505' ? 'Category already exists' : e.message });
  }
});

/* ---------- medicines ---------- */
router.get('/', requirePermission('medicines.view'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, c.name AS category
       FROM medicines m LEFT JOIN categories c ON c.id = m.category_id
      WHERE m.pharmacy_id = $1 AND m.is_active ORDER BY m.name`,
    [req.pharmacyId]
  );
  res.json(rows);
});

router.post('/', requirePermission('medicines.create'), async (req, res) => {
  const { name, categoryId, price, stockQty, reorderLevel } = req.body;
  if (!name || !(Number(price) >= 0))
    return res.status(400).json({ error: 'Name and a valid price are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO medicines (pharmacy_id, category_id, name, price, stock_qty, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.pharmacyId, categoryId || null, name.trim(), price, parseInt(stockQty) || 0, parseInt(reorderLevel) || 10]
    );
    await logAction(pool, req, 'medicine.create', { name, price });
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.code === '23505' ? 'Medicine already exists' : e.message });
  }
});

// Beddel magac, category, reorder level (ma aha qiimaha)
router.patch('/:id', requirePermission('medicines.update'), async (req, res) => {
  const { name, categoryId, reorderLevel } = req.body;
  const r = await pool.query(
    `UPDATE medicines SET name = COALESCE($1, name), category_id = COALESCE($2, category_id),
            reorder_level = COALESCE($3, reorder_level)
      WHERE id = $4 AND pharmacy_id = $5`,
    [name || null, categoryId || null, reorderLevel ?? null, req.params.id, req.pharmacyId]
  );
  res.json({ updated: r.rowCount });
});

// Ku dar stock
router.post('/:id/stock', requirePermission('medicines.update'), async (req, res) => {
  const qty = parseInt(req.body.qty);
  if (!(qty > 0)) return res.status(400).json({ error: 'Quantity must be greater than 0' });
  const r = await pool.query(
    'UPDATE medicines SET stock_qty = stock_qty + $1 WHERE id = $2 AND pharmacy_id = $3',
    [qty, req.params.id, req.pharmacyId]
  );
  await logAction(pool, req, 'medicine.restock', { medicineId: +req.params.id, qty });
  res.json({ updated: r.rowCount });
});

// Beddel qiimaha (waxaa la kaydiyaa taariikhda)
router.patch('/:id/price', requirePermission('price.update'), async (req, res) => {
  const price = Number(req.body.price);
  if (!(price >= 0)) return res.status(400).json({ error: 'Invalid price' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query(
      'SELECT price FROM medicines WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE',
      [req.params.id, req.pharmacyId]
    );
    if (!cur.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Medicine not found' });
    }
    await client.query('UPDATE medicines SET price = $1 WHERE id = $2', [price, req.params.id]);
    await client.query(
      `INSERT INTO price_history (pharmacy_id, medicine_id, old_price, new_price, changed_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.pharmacyId, req.params.id, cur.rows[0].price, price, req.user.id]
    );
    await logAction(client, req, 'price.update', { medicineId: +req.params.id, from: cur.rows[0].price, to: price });
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
