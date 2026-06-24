import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ensureStaffVerificationFields } from '../src/utils/hrmsVerificationFields.js';
import { normalizeFormFields } from '../src/utils/formFieldNormalizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formsDir = path.join(__dirname, '../../forms');

function walkJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(full));
    else if (entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

let updated = 0;
for (const file of walkJsonFiles(formsDir)) {
  const schema = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nextFields = ensureStaffVerificationFields(normalizeFormFields(schema.fields ?? []));
  const changed = JSON.stringify(schema.fields) !== JSON.stringify(nextFields);
  if (changed) {
    schema.fields = nextFields;
    fs.writeFileSync(file, `${JSON.stringify(schema, null, 2)}\n`);
    console.log('updated', path.relative(formsDir, file));
    updated += 1;
  }
}

console.log(`Done. Updated ${updated} file(s).`);
