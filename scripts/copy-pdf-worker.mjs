import { copyFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destDir = join(root, 'public');
const dest = join(destDir, 'pdf.worker.min.mjs');

const workerSrc = (() => {
  try {
    return require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
  } catch {
    console.error('pdfjs-dist is not installed. Run pnpm install first.');
    process.exit(1);
  }
})();

mkdirSync(destDir, { recursive: true });
copyFileSync(workerSrc, dest);
console.log('Copied pdf.worker.min.mjs → public/pdf.worker.min.mjs');
