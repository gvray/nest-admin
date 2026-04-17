import { spawn } from 'child_process';
import { resolve } from 'path';

// Filter out pnpm's '--' separator and pass remaining args to the shell script
const args = process.argv.slice(2).filter((arg) => arg !== '--');

const child = spawn(
  'bash',
  [resolve(__dirname, '../docker/scripts/build.sh'), ...args],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code) => process.exit(code ?? 1));
