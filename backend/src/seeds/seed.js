import connectDatabase from '../config/database.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import WorkflowTemplate from '../models/WorkflowTemplate.js';
import { loadConfigFile } from '../utils/fileLoader.js';
import { syncDemoUsers } from './syncUsers.js';
import { SUPER_ADMIN_PASSWORD } from './superadmin.js';

async function seedConfigCollection(Model, filename, mapFn) {
  const items = await loadConfigFile(filename);
  for (const item of items) {
    await Model.findOneAndUpdate(mapFn(item).filter, mapFn(item).update, { upsert: true });
  }
}

export async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    await syncDemoUsers();
    return;
  }

  console.log('Seeding database...');

  await seedConfigCollection(Department, 'departments.json', (d) => ({
    filter: { code: d.code },
    update: d,
  }));

  await seedConfigCollection(Role, 'roles.json', (r) => ({
    filter: { code: r.code },
    update: r,
  }));

  await seedConfigCollection(Permission, 'permissions.json', (p) => ({
    filter: { code: p.code },
    update: p,
  }));

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

  await syncDemoUsers();

  console.log('Seed completed. Run pnpm seed:superadmin to reset super admin password.');
  console.log('Super admin Staff ID: 12345 | default password:', SUPER_ADMIN_PASSWORD);
}

if (process.argv[1]?.includes('seed.js')) {
  connectDatabase()
    .then(() => seedDatabase())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
