// Kaydi ficil kasta oo muhiim ah (price, user, sale...)
module.exports = function logAction(db, req, action, details = {}) {
  return db.query(
    'INSERT INTO audit_logs (pharmacy_id, user_id, action, details) VALUES ($1,$2,$3,$4)',
    [req.pharmacyId || null, req.user.id, action, details]
  );
};
