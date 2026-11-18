require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function migrate() {
  try {
    const schemaPath = path.join(
      __dirname,
      '../../../../sql/schema.sql'
    );

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
