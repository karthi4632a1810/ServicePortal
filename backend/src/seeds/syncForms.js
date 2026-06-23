import connectDatabase from '../config/database.js';
import formService from '../services/form.service.js';
import Form from '../models/Form.js';

async function syncForms() {
  await connectDatabase();

  const result = await formService.syncFormsFromFiles();
  const forms = await Form.find({ active: true }).sort('department title').select('formId title department currentVersion filename');

  console.log('\nForm sync complete');
  console.log('------------------');
  console.log(`Synced: ${result.synced.length} form(s)`);
  console.log(`Removed from MongoDB: ${result.removed.forms} form(s), ${result.removed.versions} version record(s)`);
  console.log('\nActive forms in database:');
  for (const form of forms) {
    console.log(`  - ${form.formId} | ${form.title} | v${form.currentVersion} | ${form.filename}`);
  }
}

syncForms()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Form sync failed:', err);
    process.exit(1);
  });
