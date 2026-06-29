#!/usr/bin/env node
/**
 * PaperZero — MongoDB seeder
 *
 * Reads every *.json under /forms (e.g. forms/it/*.json) and upserts into
 * MongoDB Form + FormVersion collections. Also loads config/*.json data
 * (departments, roles, permissions, workflow templates) required by forms.
 *
 * Usage (from project root):
 *   node backend/scripts/seedMongoDb.js
 *   node backend/scripts/seedMongoDb.js --forms-only
 *   node backend/scripts/seedMongoDb.js --skip-users
 *
 * Environment:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/service_portal
 *
 * Docker:
 *   docker compose --profile seed run --rm seed
 *   docker compose exec backend node backend/scripts/seedMongoDb.js
 */

import connectDatabase from '../src/config/database.js';
import config from '../src/config/index.js';
import Form from '../src/models/Form.js';
import Department from '../src/models/Department.js';
import Role from '../src/models/Role.js';
import Permission from '../src/models/Permission.js';
import WorkflowTemplate from '../src/models/WorkflowTemplate.js';
import formService from '../src/services/form.service.js';
import { loadConfigFile } from '../src/utils/fileLoader.js';
import { syncDemoUsers } from '../src/seeds/syncUsers.js';
import { SUPER_ADMIN_PASSWORD } from '../src/seeds/superadmin.js';

function maskMongoUri(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//***:***@');
}

async function seedConfigCollection(Model, filename, mapFn) {
  const items = await loadConfigFile(filename);
  for (const item of items) {
    await Model.findOneAndUpdate(mapFn(item).filter, mapFn(item).update, { upsert: true });
  }
  return items.length;
}

async function seedConfigData() {
  console.log('\n[1/3] Config data (departments, roles, permissions, workflows)');

  const deptCount = await seedConfigCollection(Department, 'departments.json', (d) => ({
    filter: { code: d.code },
    update: d,
  }));
  console.log(`  departments: ${deptCount}`);

  const roleCount = await seedConfigCollection(Role, 'roles.json', (r) => ({
    filter: { code: r.code },
    update: r,
  }));
  console.log(`  roles: ${roleCount}`);

  const permCount = await seedConfigCollection(Permission, 'permissions.json', (p) => ({
    filter: { code: p.code },
    update: p,
  }));
  console.log(`  permissions: ${permCount}`);

  const workflows = await loadConfigFile('workflowTemplates.json');
  for (const wf of workflows) {
    await WorkflowTemplate.findOneAndDelete({ templateId: wf.id });
    await WorkflowTemplate.create({
      templateId: wf.id,
      name: wf.name,
      description: wf.description,
      steps: wf.steps,
      active: true,
    });
  }
  console.log(`  workflow templates: ${workflows.length}`);
}

async function seedForms() {
  console.log('\n[2/3] Forms from JSON files');
  console.log(`  source folder: ${config.paths.forms}`);

  const result = await formService.syncFormsFromFiles();
  const forms = await Form.find({ active: true })
    .sort('department title')
    .select('formId title department currentVersion filename');

  console.log(`  synced: ${result.synced.length} form(s)`);
  if (result.removed.forms || result.removed.versions) {
    console.log(
      `  removed stale: ${result.removed.forms} form(s), ${result.removed.versions} version record(s)`,
    );
  }

  console.log('\n  Active forms in MongoDB:');
  for (const form of forms) {
    console.log(`    - ${form.formId} | ${form.title} | v${form.currentVersion} | ${form.filename}`);
  }

  return result;
}

async function seedUsers() {
  console.log('\n[3/3] Demo users');
  await syncDemoUsers();
  console.log(`  super admin Staff ID: 12345 | password: ${SUPER_ADMIN_PASSWORD}`);
  console.log('  staff default password: mapims (or DEFAULT_EMPLOYEE_PASSWORD from .env)');
}

async function main() {
  const args = process.argv.slice(2);
  const formsOnly = args.includes('--forms-only');
  const skipUsers = args.includes('--skip-users');

  console.log('PaperZero MongoDB Seeder');
  console.log('------------------------');
  console.log(`MongoDB: ${maskMongoUri(config.mongodbUri)}`);

  if (formsOnly) console.log('Mode: forms only');
  else if (skipUsers) console.log('Mode: config + forms (no users)');
  else console.log('Mode: config + forms + users');

  await connectDatabase();

  if (!formsOnly) {
    await seedConfigData();
  }

  await seedForms();

  if (!formsOnly && !skipUsers) {
    await seedUsers();
  }

  console.log('\nDone.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  });
