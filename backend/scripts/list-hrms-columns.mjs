import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const table = process.env.HRMS_DB_TABLE || 'staff_profile_tb';
const conn = await mysql.createConnection({
  host: process.env.HRMS_DB_HOST,
  port: parseInt(process.env.HRMS_DB_PORT || '3306', 10),
  user: process.env.HRMS_DB_USER,
  password: process.env.HRMS_DB_PASSWORD,
  database: process.env.HRMS_DB_NAME,
});

const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${table}\``);
console.log(cols.map((c) => `${c.Field}\t${c.Type}`).join('\n'));
await conn.end();
