import { execSync } from 'node:child_process';
import path from 'node:path';

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

const frontendDir = path.resolve(process.cwd(), '..', 'frontend');
console.log(`[postinstall] Building frontend at ${frontendDir} ...`);
execSync('npm install && npm run build', { cwd: frontendDir, stdio: 'inherit' });
console.log('[postinstall] Frontend build complete.');
