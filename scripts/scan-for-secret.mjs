/* eslint-env node */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Refuses to let a Playwright report leave CI if it contains the ZPI
 * Cloudflare bypass secret. The proxy architecture keeps the secret out of
 * the browser, but this is the last line of defence: reports embed traces and
 * traces record request headers.
 *
 * The scanner inspects raw files, every .zip, and the base64 data zip that
 * Playwright embeds in index.html. It fails closed on symlinks, unsupported
 * entries, unreadable files, and archives it cannot inspect.
 *
 * Usage: node scripts/scan-for-secret.mjs e2e-report
 */

const target = process.argv[2] || 'e2e-report';
const secrets = [
  ...new Set(
    [process.env.ZERION_API_DEVELOPMENT_KEY, process.env.CF_ZPI_DEV_BYPASS_SECRET].filter(Boolean),
  ),
];

if (secrets.length === 0) {
  process.stdout.write('No bypass secret configured; nothing to scan for.\n');
  process.exit(0);
}

if (!fs.existsSync(target)) {
  process.stdout.write(`Report directory ${target} does not exist; skipping.\n`);
  process.exit(0);
}

const MAX_ARCHIVE_DEPTH = 3;
const MAX_BUFFER = 512 * 1024 * 1024;
const EMBEDDED_ZIP = /data:application\/zip;base64,([A-Za-z0-9+/=]+)/g;

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

function runUnzip(args) {
  return execFileSync('unzip', args, {
    maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

function withTempArchive(buffer, label, inspect) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-report-scan-'));
  const file = path.join(directory, 'archive.zip');
  try {
    fs.writeFileSync(file, buffer);
    inspect(file, label);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function scanZip(file, depth = 0, label = file) {
  try {
    const contents = runUnzip(['-p', file]);
    scanBuffer(contents, label);

    if (depth >= MAX_ARCHIVE_DEPTH) {
      // A nested archive we refuse to descend into could hide the secret.
      const entries = runUnzip(['-Z1', file]).toString('utf8').split('\n').filter(Boolean);
      if (entries.some((entry) => entry.endsWith('.zip'))) {
        errors.push(label);
      }
      return;
    }

    const entries = runUnzip(['-Z1', file]).toString('utf8').split('\n').filter(Boolean);
    for (const entry of entries) {
      if (!entry.endsWith('.zip')) {
        continue;
      }
      const nested = runUnzip(['-p', file, entry]);
      withTempArchive(nested, label, (nestedFile, nestedLabel) => {
        scanZip(nestedFile, depth + 1, nestedLabel);
      });
    }
  } catch {
    // Fail closed: an archive we cannot inspect could hide the secret.
    errors.push(label);
  }
}

function scanEmbeddedReport(file, buffer) {
  const html = buffer.toString('utf8');
  for (const match of html.matchAll(EMBEDDED_ZIP)) {
    const archive = Buffer.from(match[1], 'base64');
    withTempArchive(archive, file, (archiveFile, label) => {
      scanZip(archiveFile, 0, label);
    });
  }
}

function scanFile(file) {
  const buffer = fs.readFileSync(file);
  scanBuffer(buffer, file);
  if (file.endsWith('.zip')) {
    scanZip(file);
  }
  if (file.endsWith('.html')) {
    scanEmbeddedReport(file, buffer);
  }
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      // upload-artifact follows symlinks; never let one bypass the scan.
      errors.push(file);
      continue;
    }
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!entry.isFile()) {
      errors.push(file);
      continue;
    }
    scanFile(file);
  }
}

const targetStat = fs.lstatSync(target);
if (!targetStat.isDirectory() || targetStat.isSymbolicLink()) {
  errors.push(target);
} else {
  walk(target);
}

if (errors.length > 0) {
  process.stderr.write(`Refusing to upload: could not inspect ${errors.join(', ')}\n`);
  process.exit(1);
}

if (found.length > 0) {
  process.stderr.write(`Refusing to upload: the bypass secret was found in ${found.join(', ')}\n`);
  process.exit(1);
}

process.stdout.write('Report does not contain the bypass secret.\n');
