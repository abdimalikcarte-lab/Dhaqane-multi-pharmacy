
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';

  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}

function requirePermission(...codes) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];

    const allowed = codes.some((code) =>
      permissions.includes(code)
    );

    if (!allowed) {
      return res.status(403).json({
        error: 'You do not have permission',
      });
    }

    next();
  };
}

function pharmacyScope(req, res, next) {
  if (req.user.role === 'super_admin') {
    const id = Number(req.headers['x-pharmacy-id']);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'Please select a pharmacy first',
      });
    }

    req.pharmacyId = id;
  } else {
    const id = Number(req.user.pharmacyId);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(403).json({
        error: 'No pharmacy assigned to this account',
      });
    }

    req.pharmacyId = id;
  }

  next();
}

module.exports = {
  authenticate,
  requirePermission,
  pharmacyScope,
};
