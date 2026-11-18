const jwt = require('jsonwebtoken');

// Hubi token-ka (Bearer)
function authenticate(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Hubi in user-ku leeyahay mid ka mid ah permissions-ka
function requirePermission(...codes) {
  return (req, res, next) => {
    if (!codes.some((c) => req.user.permissions.includes(c)))
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Dejiso req.pharmacyId. Users caadi ah: token-ka. Super admin: header x-pharmacy-id
function pharmacyScope(req, res, next) {
  if (req.user.role === 'super_admin') {
    const id = parseInt(req.headers['x-pharmacy-id'], 10);
    if (!id) return res.status(400).json({ error: 'Select a pharmacy first' });
    req.pharmacyId = id;
  } else {
    req.pharmacyId = req.user.pharmacyId;
  }
  next();
}

module.exports = { authenticate, requirePermission, pharmacyScope };
