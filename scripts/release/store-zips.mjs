#!/usr/bin/env node

/**
 * Builds the ZIP files the store submitter needs from the existing build
 * output. It never rebuilds anything: run `npm run build:production` first.
 *
 * Outputs (in `--out-dir`, default `store-artifacts/`):
 *   chrome/zerion-wallet-extension-<tag>.zip
 *     dist/ contents at the archive root (the Chrome Web Store requires
 *     manifest.json at the root).
 *   firefox/zerion-wallet-firefox-addon-<tag>.zip
 *     dist-firefox/ contents at the archive root.
 *   firefox/zerion-wallet-firefox-addon-<tag>-sources.zip
 *     `git archive` of the tagged commit, so AMO reviewers can rebuild the
 *     exact submitted version. See SOURCE_CODE_REVIEW.md.
 *
 * Beta builds pass `--version-suffix` (the fourth manifest part the beta build
 * appends) and `--label beta`; without a tag the sources zip is `git archive
 * HEAD`, which is the commit the beta build came from.
 *
 * Usage: node scripts/release/store-zips.mjs [--tag vX.Y.Z] [--out-dir dir]
 *          [--version-suffix N] [--label beta] [--dry-run]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const options = {
    dryRun: false,
    outDir: 'store-artifacts',
    tag: undefined,
    versionSuffix: undefined,
    label: undefined,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--out-dir=')) options.outDir = arg.slice('--out-dir='.length);
    else if (arg.startsWith('--tag=')) options.tag = arg.slice('--tag='.length);
    else if (arg.startsWith('--version-suffix='))
      options.versionSuffix = arg.slice('--version-suffix='.length);
    else if (arg.startsWith('--label=')) options.label = arg.slice('--label='.length);
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return options;
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const options = parseArgs(process.argv.slice(2));
const root = process.cwd();
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedVersion = options.versionSuffix ? `${version}.${options.versionSuffix}` : version;
const tag = options.tag ?? `v${expectedVersion}`;
const suffixLabel = options.label ? `-${options.label}` : '';

if (tag !== `v${expectedVersion}`) {
  fail(`Tag ${tag} does not match the built version ${expectedVersion}. Refusing to zip.`);
}

function requireBuildOutput(dir) {
  const manifestPath = path.join(root, dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    fail(`${dir}/manifest.json is missing. Run \`npm run build:production\` first.`);
  }
  const { version: manifestVersion } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifestVersion !== expectedVersion) {
    fail(
      `${dir}/manifest.json has version ${manifestVersion}, but the build should be ${expectedVersion}. ` +
        'Rebuild before zipping.',
    );
  }
}

function zipDirectory(dir, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.rmSync(destination, { force: true });
  // -X drops extra file attributes; contents land at the archive root.
  execFileSync('zip', ['-r', '-X', '-q', destination, '.'], {
    cwd: path.join(root, dir),
    stdio: 'inherit',
  });
}

const artifacts = {
  chrome: path.join(
    root,
    options.outDir,
    'chrome',
    `zerion-wallet-extension-${tag}${suffixLabel}.zip`,
  ),
  firefox: path.join(
    root,
    options.outDir,
    'firefox',
    `zerion-wallet-firefox-addon-${tag}${suffixLabel}.zip`,
  ),
  firefoxSources: path.join(
    root,
    options.outDir,
    'firefox',
    `zerion-wallet-firefox-addon-${tag}${suffixLabel}-sources.zip`,
  ),
};

if (options.dryRun) {
  console.log(`[dry-run] Would build store artifacts for ${tag}:`);
  for (const [name, artifact] of Object.entries(artifacts)) {
    console.log(`  ${name}: ${path.relative(root, artifact)}`);
  }
  process.exit(0);
}

requireBuildOutput('dist');
requireBuildOutput('dist-firefox');

zipDirectory('dist', artifacts.chrome);
zipDirectory('dist-firefox', artifacts.firefox);

fs.mkdirSync(path.dirname(artifacts.firefoxSources), { recursive: true });
fs.rmSync(artifacts.firefoxSources, { force: true });
execFileSync(
  'git',
  [
    'archive',
    '--format=zip',
    `--prefix=zerion-wallet-extension-${tag}${suffixLabel}/`,
    '-o',
    artifacts.firefoxSources,
    // A beta build has no tag; HEAD is the commit it was built from.
    options.tag ?? 'HEAD',
  ],
  { cwd: root, stdio: 'inherit' },
);

for (const [name, artifact] of Object.entries(artifacts)) {
  const { size } = fs.statSync(artifact);
  if (size === 0) fail(`${name} artifact is empty: ${artifact}`);
  const humanSize = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(0)} KiB`;
  console.log(`${name}: ${path.relative(root, artifact)} (${humanSize})`);
}

console.log('Store artifacts ready.');
