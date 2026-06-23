import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const storageDir = path.join(root, 'this-project-storage');
const stamp = new Date().toISOString().slice(0, 10);
const backupDir = path.join(storageDir, `mongodb-backup-${stamp}`);
const archivePath = path.join(storageDir, `mongodb-service_portal-${stamp}.archive.gz`);
const dbName = 'service_portal';

fs.mkdirSync(storageDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

console.log('MongoDB backup');
console.log('Database:', dbName);
console.log('Output dir:', backupDir);
console.log('Archive:', archivePath);
console.log('');

const containerDumpDir = `/tmp/paperzero-backup-${stamp}`;

execSync(
  `docker exec mongodb mongodump --db=${dbName} --out=${containerDumpDir}`,
  { stdio: 'inherit', cwd: root },
);

execSync(
  `docker cp mongodb:${containerDumpDir}/${dbName} "${backupDir.replace(/\\/g, '/')}"`,
  { stdio: 'inherit', cwd: root, shell: true },
);

const archive = execSync(
  `docker exec mongodb mongodump --db=${dbName} --archive --gzip`,
  { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 },
);
fs.writeFileSync(archivePath, archive);

execSync(`docker exec mongodb rm -rf ${containerDumpDir}`, { stdio: 'inherit' });

const collections = fs.readdirSync(path.join(backupDir, dbName)).filter((f) => f.endsWith('.bson'));
const manifest = {
  database: dbName,
  createdAt: new Date().toISOString(),
  backupDir: path.relative(root, path.join(backupDir, dbName)).replace(/\\/g, '/'),
  archive: path.basename(archivePath),
  collections: collections.map((file) => file.replace('.bson', '')),
};

fs.writeFileSync(
  path.join(backupDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log('\nBackup complete');
console.log(`Collections: ${manifest.collections.length}`);
console.log(manifest.collections.join(', '));
