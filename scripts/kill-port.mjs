import { execSync } from 'node:child_process';

const port = Number(process.argv[2]);

if (!port || Number.isNaN(port)) {
  console.error('Usage: node scripts/kill-port.mjs <port>');
  process.exit(1);
}

function killOnWindows() {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();

    for (const line of output.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && pid !== '0') pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Freed port ${port} (stopped PID ${pid})`);
      } catch {
        // process may have already exited
      }
    }

    if (pids.size === 0) {
      console.log(`Port ${port} is already free`);
    }
  } catch {
    console.log(`Port ${port} is already free`);
  }
}

function killOnUnix() {
  try {
    const pids = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (pids.length === 0) {
      console.log(`Port ${port} is already free`);
      return;
    }

    for (const pid of pids) {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`Freed port ${port} (stopped PID ${pid})`);
    }
  } catch {
    console.log(`Port ${port} is already free`);
  }
}

if (process.platform === 'win32') {
  killOnWindows();
} else {
  killOnUnix();
}
