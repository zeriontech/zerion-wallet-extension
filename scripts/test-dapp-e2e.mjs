/* eslint-env node */
/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Runs the dapp Playwright suite against a locally built extension.
 * Builds dist-e2e when it is missing or older than the extension sources.
 */

const distPath = path.resolve(process.cwd(), process.env.E2E_DIST || 'dist-e2e');
const manifestPath = path.join(distPath, 'manifest.json');

if (!process.env.DAPP_URL) {
  console.error(
    'DAPP_URL is required. Point it at the hosted test dapp or a running local server, for example https://zeriontech.github.io/zerion-test-dapp/ or http://localhost:9011.',
  );
  process.exit(1);
}

function newestMtime(target) {
  const stats = statSync(target);
  if (!stats.isDirectory()) {
    return stats.mtimeMs;
  }
  let newest = stats.mtimeMs;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    newest = Math.max(newest, newestMtime(path.join(target, entry.name)));
  }
  return newest;
}

const buildInputs = ['src', 'package.json', 'scripts/build.mjs', 'vite.config.ts'].filter((input) =>
  existsSync(input),
);
const newestInput = Math.max(...buildInputs.map((input) => newestMtime(input)));
const needsBuild = !existsSync(manifestPath) || statSync(manifestPath).mtimeMs < newestInput;

if (process.env.E2E_SKIP_BUILD === '1') {
  if (!existsSync(manifestPath)) {
    console.error(
      `E2E_SKIP_BUILD=1 but ${manifestPath} does not exist. Run \`npm run build:e2e\` first.`,
    );
    process.exit(1);
  }
} else if (needsBuild) {
  console.log(`Building E2E extension into ${distPath}`);
  const build = spawnSync('npm', ['run', 'build:e2e'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

const playwrightBin = path.resolve(
  process.cwd(),
  'node_modules/.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright',
);
const result = spawnSync(
  playwrightBin,
  ['test', '--config', 'playwright.dapp.config.ts', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

if (result.error) {
  console.error(`Failed to run Playwright: ${String(result.error)}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
