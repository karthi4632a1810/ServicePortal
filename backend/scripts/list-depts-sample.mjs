import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const conn = await mysql.createConnection({
  host: process.env.HRMS_DB_HOST,
  user: process.env.HRMS_DB_USER,
  password: process.env.HRMS_DB_PASSWORD,
  database: process.env.HRMS_DB_NAME,
});

const [rows] = await conn.execute(
  "SELECT id, name FROM staff_dept_master WHERE del = 1 AND name <> '' ORDER BY name LIMIT 20",
);
console.log(rows);
await conn.end();
