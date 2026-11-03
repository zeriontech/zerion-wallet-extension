/* eslint-env node */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Refuses to let a Playwright report leave CI if it contains the ZPI
 * Cloudflare bypass secret. The proxy architecture keeps the secret out of
 * the browser, but this is the last line of defence: reports embed traces and
 * traces record request headers.
 *
 * Usage: node scripts/scan-for-secret.mjs e2e-report
 */

const target = process.argv[2] || 'e2e-report';
const secrets = [
  ...new Set(
    [
      process.env.ZERION_API_DEVELOPMENT_KEY,
      process.env.CF_ZPI_DEV_BYPASS_SECRET,
    ].filter(Boolean)
  ),
];

if (secrets.length === 0) {
  process.stdout.write('No bypass secret configured; nothing to scan for.\n');
  process.exit(0);
}

if (!fs.existsSync(target)) {
  process.stdout.write(
    `Report directory ${target} does not exist; skipping.\n`
  );
  process.exit(0);
}

const secretBuffers = secrets.map((secret) => Buffer.from(secret));
const found = [];
const errors = [];

function scanBuffer(buffer, file) {
  if (secretBuffers.some((secretBuffer) => buffer.includes(secretBuffer))) {
    found.push(file);
    return true;
  }
  return false;
}

function scanZip(file) {
  try {
    const contents = execFileSync('unzip', ['-p', file], {
      maxBuffer: 512 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    scanBuffer(contents, file);
  } catch {
    // Fail closed: an archive we cannot inspect could hide the secret.
    errors.push(file);
  }
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const buffer = fs.readFileSync(file);
    scanBuffer(buffer, file);
    if (file.endsWith('.zip')) {
      scanZip(file);
    }
  }
}

walk(target);

if (errors.length > 0) {
  process.stderr.write(
    `Refusing to upload: could not inspect ${errors.join(', ')}\n`
  );
  process.exit(1);
}

if (found.length > 0) {
  process.stderr.write(
    `Refusing to upload: the bypass secret was found in ${found.join(', ')}\n`
  );
  process.exit(1);
}

process.stdout.write('Report does not contain the bypass secret.\n');
