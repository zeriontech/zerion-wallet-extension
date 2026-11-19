#!/usr/bin/env node

/**
 * Single preflight for the unified e2e suite (extension + dapp).
 *
 * Runs before `npm run test:e2e*`:
 *   1. Ensures the ZPI development token is in `.env` (copying it from the
 *      main checkout when running in a worktree). See ensure-e2e-env.mjs.
 *   2. Builds `dist-e2e` when it is missing or older than the build inputs.
 *
 * `E2E_SKIP_BUILD=1` skips the build check.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ensureE2eEnv } from './ensure-e2e-env.mjs';

const env = ensureE2eEnv();
if (!env.ok) {
  // GitHub Actions, not `CI`: agent shells on a dev machine often export CI=true.
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('CI: no local .env; the token comes from the job environment.'); // eslint-disable-line no-console
  } else if (process.env.E2E_ALLOW_NO_TOKEN === '1') {
    console.warn(env.message); // eslint-disable-line no-console
  } else {
    console.error(env.message); // eslint-disable-line no-console
    process.exit(1);
  }
} else {
  console.log(env.message); // eslint-disable-line no-console
}

if (process.env.E2E_SKIP_BUILD === '1') {
  process.exit(0);
}

const distPath = path.resolve(process.cwd(), process.env.E2E_DIST || 'dist-e2e');
const manifestPath = path.join(distPath, 'manifest.json');

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

// `.env` is a build input: its token decides whether the build points at the
// local proxy. A token copied after an earlier build must trigger a rebuild.
const buildInputs = [
  'src',
  'package.json',
  'scripts/build.mjs',
  'scripts/build-e2e.mjs',
  'vite.config.ts',
  '.env',
].filter((input) => existsSync(input));

if (!buildInputs.includes('src') && !existsSync(manifestPath)) {
  console.error('Cannot find the extension sources; run this from the repository root.'); // eslint-disable-line no-console
  process.exit(1);
}

const newestInput = Math.max(...buildInputs.map((input) => newestMtime(input)));
const needsBuild = !existsSync(manifestPath) || statSync(manifestPath).mtimeMs < newestInput;

if (!needsBuild) {
  process.exit(0);
}

console.log(`Building E2E extension into ${distPath}`); // eslint-disable-line no-console
execFileSync('npm', ['run', 'build:e2e'], { stdio: 'inherit', env: process.env });
