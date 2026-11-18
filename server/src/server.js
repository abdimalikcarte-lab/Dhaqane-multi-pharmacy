const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { authenticate, pharmacyScope } = require('./middleware/auth');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pharmacies', authenticate, require('./routes/pharmacies'));

// Wax kasta oo hoose waa ku xaddidan yihiin pharmacy-ga la doortay
const scoped = [authenticate, pharmacyScope];
app.use('/api/users', ...scoped, require('./routes/users'));
app.use('/api/medicines', ...scoped, require('./routes/medicines'));
app.use('/api/sales', ...scoped, require('./routes/sales'));
app.use('/api/audit', ...scoped, require('./routes/audit'));
app.use('/api/dashboard', ...scoped, require('./routes/dashboard'));

// Khalad aan la filayn: ha ka dhicin server-ka
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
