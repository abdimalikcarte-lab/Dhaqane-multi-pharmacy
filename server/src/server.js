require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const { authenticate, pharmacyScope } =
  require('./middleware/auth');

const app = express();

const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '1mb' }));

// API health check
app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');

  res.json({
    ok: true,
    message: 'Dhaqane Multi-Pharmacy API is running',
    database: 'connected',
  });
});

// Authentication
app.use('/api/auth', require('./routes/auth'));

// Pharmacy management
app.use(
  '/api/pharmacies',
  authenticate,
  require('./routes/pharmacies')
);

// Pharmacy-scoped routes
const scoped = [authenticate, pharmacyScope];

app.use('/api/users', ...scoped, require('./routes/users'));
app.use('/api/medicines', ...scoped, require('./routes/medicines'));
app.use('/api/sales', ...scoped, require('./routes/sales'));
app.use('/api/audit', ...scoped, require('./routes/audit'));
app.use('/api/dashboard', ...scoped, require('./routes/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dhaqane API running on port ${PORT}`);
});
