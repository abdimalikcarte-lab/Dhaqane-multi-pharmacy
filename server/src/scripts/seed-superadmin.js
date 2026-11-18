const bcrypt = require('bcryptjs');
const pool = require('../db');

// Isticmaal: node src/scripts/seed-superadmin.js email password
const [email, password] = process.argv.slice(2);

(async () => {
  if (!email || !password) {
    console.log('Usage: node src/scripts/seed-superadmin.js email password');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (pharmacy_id, role_id, full_name, email, password_hash)
     VALUES (NULL, (SELECT id FROM roles WHERE name = 'super_admin'), 'Super Admin', $1, $2)`,
    [email.trim().toLowerCase(), hash]
  );
  console.log('Super admin created:', email);
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
