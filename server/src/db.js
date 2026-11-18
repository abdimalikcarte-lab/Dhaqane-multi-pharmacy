require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || '';
module.exports = new Pool({
  connectionString: url,
  ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
});
