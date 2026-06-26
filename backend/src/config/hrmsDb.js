import mysql from 'mysql2/promise';
import config from './index.js';

let pool = null;

export function isHrmsDbConfigured() {
  return Boolean(config.hrms.db.host && config.hrms.db.user && config.hrms.db.database);
}

export function getHrmsPool() {
  if (!isHrmsDbConfigured()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: config.hrms.db.host,
      port: config.hrms.db.port,
      user: config.hrms.db.user,
      password: config.hrms.db.password,
      database: config.hrms.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      connectTimeout: 8000,
    });
  }
  return pool;
}

export async function queryHrms(sql, params = []) {
  const db = getHrmsPool();
  if (!db) return null;
  const [rows] = await db.execute(sql, params);
  return rows;
}
