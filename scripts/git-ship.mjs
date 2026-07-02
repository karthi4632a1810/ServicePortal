#!/usr/bin/env node
/**
 * Quick commit + push: pnpm ship "your message"
 * Default message: All done
 */
import { execSync } from 'child_process';

const msg = process.argv.slice(2).join(' ').trim() || 'All done';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

try {
  run('git add .');
  run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
  run('git push');
} catch {
  process.exit(1);
}
