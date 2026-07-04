import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Runs as a postinstall hook so that Railway's configured Build Command
// ("npm install", with Root Directory = backend) also produces
// frontend/dist automatically, with zero extra Railway configuration.
//
// Gated to Railway only: outside of Railway (i.e. a normal local
// `npm install` in backend/) this is a silent no-op, so local development
// (separate frontend/backend dev servers) is completely unaffected.
const isRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.RAILWAY_PROJECT_ID
);

if (!isRailway) {
  console.log('[postinstall] Not running on Railway — skipping automatic frontend build.');
  process.exit(0);
}

// Resolve relative to this script's own file location on disk, not
// process.cwd() — Railway's working directory during the build (with Root
// Directory = backend) is not guaranteed to be backend/ itself (e.g. it may
// run from /app). This file always lives at <repo root>/backend/scripts/,
// so walking up two levels from here reliably lands on the repo root
// regardless of what cwd the npm lifecycle script was invoked from.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const frontendDir = path.join(repoRoot, 'frontend');

if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.error(
    `[postinstall] ERROR: frontend project not found at "${frontendDir}".\n` +
      '[postinstall] This build environment does not have the "frontend" directory available ' +
      'next to "backend" (only backend/ appears to be present on disk).\n' +
      '[postinstall] Fix: ensure Railway checks out the full repository so frontend/ and backend/ ' +
      'are siblings during the build, or build/serve the frontend as a separate service instead of ' +
      'relying on this automatic postinstall build.'
  );
  process.exit(1);
}

function run(command, args) {
  console.log(`[postinstall] $ ${command} ${args.join(' ')} (cwd: ${frontendDir})`);
  const result = spawnSync(command, args, { cwd: frontendDir, stdio: 'inherit' });

  if (result.error) {
    console.error(`[postinstall] Failed to run "${command}": ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[postinstall] "${command} ${args.join(' ')}" exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`[postinstall] Building frontend at ${frontendDir} ...`);
run('npm', ['install']);
run('npm', ['run', 'build']);
console.log('[postinstall] Frontend build complete.');
