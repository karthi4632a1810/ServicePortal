import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.HRMS_DB_HOST || 'localhost',
  port: parseInt(process.env.HRMS_DB_PORT || '3306', 10),
  user: process.env.HRMS_DB_USER,
  password: process.env.HRMS_DB_PASSWORD,
  database: process.env.HRMS_DB_NAME,
  table: process.env.HRMS_DB_TABLE || 'staff_profile_tb',
};

const staffId = process.argv[2] || '60464';
const phone = process.argv[3] || '';

async function test() {
  console.log('HRMS DB test');
  console.log('------------');
  console.log(`Host:     ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User:     ${config.user}`);
  console.log(`Table:    ${config.table}`);
  console.log(`Staff ID: ${staffId}`);
  if (phone) console.log(`Phone:    ${phone}`);
  console.log('');

  if (!config.user || !config.database) {
    console.error('FAIL: HRMS_DB_USER or HRMS_DB_NAME not set in backend/.env');
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 10000,
    });
    console.log('OK: Connected to MySQL');

    const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${config.table}\``);
    console.log(`OK: Table has ${cols.length} columns`);

    const [rows] = await conn.execute(
      `SELECT * FROM \`${config.table}\` WHERE staff_id = ? LIMIT 1`,
      [staffId],
    );

    if (!rows.length) {
      console.log(`WARN: No row found for staff_id = "${staffId}"`);
      process.exit(1);
    }

    const row = rows[0];
    if (phone) {
      const digits = phone.replace(/\D/g, '').slice(-10);
      const m1 = String(row.mobile_1 || '').replace(/\D/g, '').slice(-10);
      const m2 = String(row.mobile_2 || '').replace(/\D/g, '').slice(-10);
      if (digits !== m1 && digits !== m2) {
        console.error(`FAIL: Phone ${phone} does not match mobile_1 (${row.mobile_1}) or mobile_2 (${row.mobile_2})`);
        process.exit(1);
      }
      console.log('OK: Staff ID and phone matched');
    }

    console.log('OK: Employee found');
    console.log(JSON.stringify(row, null, 2));
  } catch (err) {
    console.error('FAIL:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Hint: MySQL is not running on this host/port, or HRMS_DB_HOST should be your remote server hostname (not localhost).');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Hint: Wrong username or password in backend/.env');
    }
    if (err.code === 'ENOTFOUND') {
      console.error('Hint: HRMS_DB_HOST hostname could not be resolved.');
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

test();
