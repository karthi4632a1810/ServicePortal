import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { enrichFormSchema } from '../src/utils/formMetadata.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formsDir = path.join(__dirname, '../../forms');

const folderLegacy = {
  it: 'IT',
};

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

const files = await walk(formsDir);
let updated = 0;

for (const file of files) {
  const raw = JSON.parse(await fs.readFile(file, 'utf8'));
  const folder = path.basename(path.dirname(file));
  const legacyCode = folderLegacy[folder] || raw.department;
  const enriched = enrichFormSchema({ ...raw, department: raw.department || legacyCode });
  const next = JSON.stringify(enriched, null, 2) + '\n';
  const prev = JSON.stringify(raw, null, 2) + '\n';
  if (next !== prev) {
    await fs.writeFile(file, next);
    updated += 1;
    console.log('updated', path.relative(formsDir, file), '->', enriched.departmentId, enriched.department);
  }
}

console.log(`Done. Updated ${updated} file(s).`);
