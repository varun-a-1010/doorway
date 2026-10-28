// Fetches the shared Qloo test key from Doppler shared/dev_mac into the child
// process's environment only. Nothing is written to disk or printed.
import { execFileSync, spawn } from 'node:child_process';
const args = process.argv.slice(2);
if (!args.length) throw new Error('Provide a command to run.');
const env = { ...process.env };
if (!env.QLOO_API_KEY) {
  try {
    env.QLOO_API_KEY = execFileSync(
      'doppler',
      ['secrets', 'get', 'QLOO_API_KEY', '--project', 'shared', '--config', 'dev_mac', '--plain'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
  } catch {
    console.error('Could not read QLOO_API_KEY from Doppler shared/dev_mac. Check Doppler access.');
    process.exit(1);
  }
}
const child = spawn(args[0], args.slice(1), { env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', () => process.exit(1));
child.on('exit', (code) => process.exit(code ?? 1));
