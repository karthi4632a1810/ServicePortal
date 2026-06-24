import config from '../config/index.js';
import { AppError } from '../utils/response.js';
import { isHrmsDbConfigured, queryHrms } from '../config/hrmsDb.js';
import {
  buildFullName,
  mapStaffRow,
  normalizeEmployee,
  normalizePhone,
  phoneMatchesRow,
} from '../utils/hrmsMapper.js';

function formatDbError(err) {
  if (err.message) return err.message;
  if (err.code === 'ECONNREFUSED') {
    return `Cannot connect to MySQL at ${config.hrms.db.host}:${config.hrms.db.port}`;
  }
  return err.code || 'Unknown database error';
}

export class HrmsService {
  async getTableColumns() {
    if (!isHrmsDbConfigured()) return [];
    const table = config.hrms.db.table;
    const rows = await queryHrms(`SHOW COLUMNS FROM \`${table}\``);
    return rows?.map((col) => ({
      name: col.Field,
      type: col.Type,
      nullable: col.Null === 'YES',
    })) ?? [];
  }

  async testConnection() {
    if (!isHrmsDbConfigured()) {
      return { configured: false, connected: false, message: 'HRMS DB env vars not set (HRMS_DB_HOST, HRMS_DB_USER, HRMS_DB_NAME)' };
    }

    try {
      await queryHrms('SELECT 1 AS ok');
      const [countRow] = await queryHrms(
        `SELECT COUNT(*) AS total FROM \`${config.hrms.db.table}\``,
      );
      const columns = await this.getTableColumns();
      return {
        configured: true,
        connected: true,
        host: config.hrms.db.host,
        port: config.hrms.db.port,
        database: config.hrms.db.database,
        table: config.hrms.db.table,
        totalStaff: countRow?.total ?? 0,
        columnCount: columns.length,
        columns: columns.map((c) => c.name),
        message: 'Connected to HRMS database',
      };
    } catch (err) {
      return {
        configured: true,
        connected: false,
        host: config.hrms.db.host,
        port: config.hrms.db.port,
        database: config.hrms.db.database,
        table: config.hrms.db.table,
        message: formatDbError(err),
        hint: err.code === 'ECONNREFUSED'
          ? 'MySQL is not reachable. Use your cPanel MySQL hostname (not localhost) and enable Remote MySQL for your IP.'
          : undefined,
      };
    }
  }

  async getDepartments() {
    if (!isHrmsDbConfigured()) {
      throw new AppError('Employee database not configured', 503);
    }

    const table = config.hrms.db.deptTable;
    const rows = await queryHrms(
      `SELECT id, name FROM \`${table}\` WHERE del = 1 AND name <> '' ORDER BY d_order, name`,
    );

    return rows?.map((row) => ({
      id: row.id,
      name: String(row.name).trim(),
    })) ?? [];
  }

  async getDesignations(departmentId) {
    if (!isHrmsDbConfigured()) {
      throw new AppError('Employee database not configured', 503);
    }

    const deptId = String(departmentId ?? '').trim();
    if (!deptId) {
      throw new AppError('Department ID is required', 400);
    }

    const table = config.hrms.db.desgTable;
    const rows = await queryHrms(
      `SELECT id, d_id, name, sname FROM \`${table}\` WHERE d_id = ? AND del = 1 AND name <> '' ORDER BY d_order, name`,
      [deptId],
    );

    return rows?.map((row) => ({
      id: row.id,
      departmentId: row.d_id,
      name: String(row.name).trim(),
      shortName: row.sname ? String(row.sname).trim() : '',
    })) ?? [];
  }

  async resolveStaffNameByProfileId(profileId) {
    if (!profileId || profileId === '0') return '';
    const table = config.hrms.db.table;
    const rows = await queryHrms(
      `SELECT staff_title, staff_name, staff_initial FROM \`${table}\` WHERE id = ? AND del = 1 LIMIT 1`,
      [profileId],
    );
    if (!rows?.length) return '';
    return buildFullName(rows[0]);
  }

  async resolveDepartmentHod(departmentId) {
    if (!departmentId) return '';
    const table = config.hrms.db.deptAuthTable;
    const rows = await queryHrms(
      `SELECT dept_head, dept_id FROM \`${table}\`
       WHERE del = 1 AND dept_head > 0
       AND FIND_IN_SET(?, REPLACE(dept_id, ' ', ''))
       ORDER BY (LENGTH(dept_id) - LENGTH(REPLACE(dept_id, ',', ''))) ASC
       LIMIT 1`,
      [departmentId],
    );
    if (!rows?.length) return '';
    return this.resolveStaffNameByProfileId(rows[0].dept_head);
  }

  async resolveAttendanceCategory(attendanceCategoryId) {
    if (!attendanceCategoryId) return '';
    const table = config.hrms.db.attSetupTable;
    try {
      const rows = await queryHrms(
        `SELECT staff_category FROM \`${table}\` WHERE id = ? AND del = 1 LIMIT 1`,
        [attendanceCategoryId],
      );
      return rows?.[0]?.staff_category ? String(rows[0].staff_category).trim() : '';
    } catch {
      return '';
    }
  }

  async enrichMasterLookups(employee) {
    if (!isHrmsDbConfigured()) return employee;

    const deptTable = config.hrms.db.deptTable;
    const desgTable = config.hrms.db.desgTable;
    const tasks = [];

    if (employee.departmentId) {
      tasks.push(
        queryHrms(
          `SELECT id, name FROM \`${deptTable}\` WHERE id = ? LIMIT 1`,
          [employee.departmentId],
        ).then((rows) => ({ type: 'dept', row: rows?.[0] })),
      );
      tasks.push(
        this.resolveDepartmentHod(employee.departmentId).then((name) => ({ type: 'hod', name })),
      );
    }

    if (employee.designationId) {
      tasks.push(
        queryHrms(
          `SELECT id, d_id, name FROM \`${desgTable}\` WHERE id = ? LIMIT 1`,
          [employee.designationId],
        ).then((rows) => ({ type: 'desg', row: rows?.[0] })),
      );
    }

    if (employee.reportingManagerId && employee.reportingManagerId !== '0') {
      tasks.push(
        this.resolveStaffNameByProfileId(employee.reportingManagerId).then((name) => ({
          type: 'manager',
          name,
        })),
      );
    }

    if (employee.attendanceCategoryId) {
      tasks.push(
        this.resolveAttendanceCategory(employee.attendanceCategoryId).then((name) => ({
          type: 'attCategory',
          name,
        })),
      );
    }

    if (!tasks.length) return employee;

    const results = await Promise.all(tasks);
    const enriched = { ...employee };

    for (const result of results) {
      if (result.type === 'dept' && result.row?.name) {
        enriched.department = String(result.row.name).trim();
      }
      if (result.type === 'desg' && result.row?.name) {
        enriched.designation = String(result.row.name).trim();
      }
      if (result.type === 'hod' && result.name) {
        enriched.hod = result.name;
      }
      if (result.type === 'manager' && result.name) {
        enriched.reportingManager = result.name;
      }
      if (result.type === 'attCategory' && result.name) {
        enriched.attendanceCategory = result.name;
      }
    }

    delete enriched.reportingManagerId;
    delete enriched.attendanceCategoryId;
    delete enriched.bloodGroupId;
    delete enriched.profileId;

    return enriched;
  }

  async getEmployeeFromDb(staffId, phone) {
    const table = config.hrms.db.table;
    const rows = await queryHrms(
      `SELECT * FROM \`${table}\` WHERE staff_id = ? LIMIT 1`,
      [staffId],
    );

    if (!rows?.length) {
      throw new AppError(`Employee not found: ${staffId}`, 404);
    }

    const row = rows[0];

    if (phone) {
      const normalizedInput = normalizePhone(phone);
      if (normalizedInput.length < 10) {
        throw new AppError('Valid 10-digit phone number is required', 400);
      }
      if (!phoneMatchesRow(row, phone)) {
        throw new AppError('Phone number does not match records for this staff ID', 403);
      }
    }

    const mapped = mapStaffRow(row);
    const employee = normalizeEmployee(mapped);
    return this.enrichMasterLookups(employee);
  }

  async getEmployee(employeeId, phone) {
    const normalizedId = employeeId.trim();
    if (!normalizedId) {
      throw new AppError('Employee ID is required', 400);
    }

    if (isHrmsDbConfigured()) {
      try {
        return await this.getEmployeeFromDb(normalizedId, phone);
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Employee database connection failed: ${formatDbError(err)}`, 503);
      }
    }

    if (config.hrms.apiUrl) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (config.hrms.apiKey) headers.Authorization = `Bearer ${config.hrms.apiKey}`;

        const qs = phone ? `?phone=${encodeURIComponent(phone)}` : '';
        const response = await fetch(
          `${config.hrms.apiUrl}/employees/${encodeURIComponent(normalizedId)}${qs}`,
          { headers },
        );
        if (response.ok) {
          const data = await response.json();
          return normalizeEmployee(data.data || data);
        }
      } catch (err) {
        console.warn('HRMS API unavailable:', err.message);
      }
    }

    throw new AppError(`Employee not found: ${normalizedId}`, 404);
  }
}

export default new HrmsService();
