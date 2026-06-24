import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

export default {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/service_portal',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  hrms: {
    apiUrl: process.env.HRMS_API_URL || '',
    apiKey: process.env.HRMS_API_KEY || '',
    db: {
      host: process.env.HRMS_DB_HOST || '',
      port: parseInt(process.env.HRMS_DB_PORT || '3306', 10),
      user: process.env.HRMS_DB_USER || '',
      password: process.env.HRMS_DB_PASSWORD || '',
      database: process.env.HRMS_DB_NAME || '',
      table: process.env.HRMS_DB_TABLE || 'staff_profile_tb',
      deptTable: process.env.HRMS_DEPT_TABLE || 'staff_dept_master',
      desgTable: process.env.HRMS_DESG_TABLE || 'staff_desg_master',
      deptAuthTable: process.env.HRMS_DEPT_AUTH_TABLE || 'dept_auth',
      attSetupTable: process.env.HRMS_ATT_SETUP_TABLE || 'basic_attendance_setup_tb',
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@company.com',
  },
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
  defaultEmployeePassword: process.env.DEFAULT_EMPLOYEE_PASSWORD || 'mapims',
  paths: {
    root: rootDir,
    config: path.join(rootDir, 'config'),
    forms: path.join(rootDir, 'forms'),
    uploads: path.join(rootDir, 'uploads'),
  },
};
