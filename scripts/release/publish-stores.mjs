#!/usr/bin/env node

/**
 * Submits an already-built release to the Chrome Web Store and/or Firefox AMO
 * through `publish-browser-extension` (the engine behind `wxt submit`).
 *
 * All credentials come from the environment; nothing is ever printed.
 *   Chrome (CWS API v2 — v1.1 was retired on 2026-10-15):
 *     CHROME_API_VERSION=v2
 *     CHROME_EXTENSION_ID, CHROME_PUBLISHER_ID
 *     CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL, CHROME_SERVICE_ACCOUNT_PRIVATE_KEY
 *   Firefox (AMO):
 *     FIREFOX_EXTENSION_ID, FIREFOX_JWT_ISSUER, FIREFOX_JWT_SECRET
 *
 * Usage:
 *   node scripts/release/publish-stores.mjs --store=all [--dry-run] \
 *     [--chrome-zip=path] [--firefox-zip=path] [--firefox-sources-zip=path] \
 *     [--summary-out=store-submission.json]
 *
 * `--dry-run` authenticates against both stores and validates the ZIPs without
 * uploading anything.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  ChromeWebStoreV2,
  FirefoxAddonStoreV5,
  resolveConfig,
  validateConfig,
} from 'publish-browser-extension';

function parseArgs(argv) {
  const options = {
    chromeZip: undefined,
    dryRun: false,
    firefoxSourcesZip: undefined,
    firefoxZip: undefined,
    store: 'all',
    summaryOut: 'store-submission.json',
  };
  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--store=')) options.store = arg.slice('--store='.length);
    else if (arg.startsWith('--chrome-zip=')) options.chromeZip = arg.slice('--chrome-zip='.length);
    else if (arg.startsWith('--firefox-zip='))
      options.firefoxZip = arg.slice('--firefox-zip='.length);
    else if (arg.startsWith('--firefox-sources-zip='))
      options.firefoxSourcesZip = arg.slice('--firefox-sources-zip='.length);
    else if (arg.startsWith('--summary-out='))
      options.summaryOut = arg.slice('--summary-out='.length);
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  if (!['all', 'chrome', 'firefox'].includes(options.store)) {
    console.error(`--store must be one of all, chrome, firefox (got ${options.store}).`);
    process.exit(1);
  }
  return options;
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const SECRET_ENV_VARS = [
  'CHROME_SERVICE_ACCOUNT_PRIVATE_KEY',
  'FIREFOX_JWT_SECRET',
  'CHROME_CLIENT_SECRET',
  'CHROME_REFRESH_TOKEN',
];

function redact(text) {
  let output = String(text);
  for (const name of SECRET_ENV_VARS) {
    const value = process.env[name];
    if (!value) continue;
    for (const variant of new Set([value, value.replaceAll('\\n', '\n')])) {
      output = output.split(variant).join('***');
    }
  }
  return output;
}

function requireZip(file, label) {
  if (!file) fail(`${label} is required for this store selection.`);
  if (!fs.existsSync(file)) fail(`${label} not found: ${file}`);
}

const options = parseArgs(process.argv.slice(2));
const { version } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const stores = options.store === 'all' ? ['chrome', 'firefox'] : [options.store];

const config = { dryRun: options.dryRun };
if (stores.includes('chrome')) {
  // CWS API v1.1 stopped working on 2026-10-15; the tool defaults to v1.1.
  if (process.env.CHROME_API_VERSION !== 'v2') {
    fail(
      'CHROME_API_VERSION must be "v2". The Chrome Web Store API v1.1 was retired on 2026-10-15, ' +
        'so submissions need a service account (CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL / ' +
        'CHROME_SERVICE_ACCOUNT_PRIVATE_KEY / CHROME_PUBLISHER_ID).',
    );
  }
  requireZip(options.chromeZip, '--chrome-zip');
  config.chrome = { zip: options.chromeZip, apiVersion: 'v2' };
}
if (stores.includes('firefox')) {
  requireZip(options.firefoxZip, '--firefox-zip');
  requireZip(options.firefoxSourcesZip, '--firefox-sources-zip');
  config.firefox = {
    zip: options.firefoxZip,
    sourcesZip: options.firefoxSourcesZip,
  };
}

console.log(
  `${options.dryRun ? '[dry-run] Validating' : 'Submitting'} ${version} to: ${stores.join(', ')}`,
);

// The library's `submit()` aggregates stores but throws on the first failure,
// which hides which store broke. Drive each store adapter directly so Slack
// gets a per-store status, and authenticate the same way `submit()` does.
const resolved = validateConfig(resolveConfig(config));

const summary = { version, dryRun: options.dryRun, stores: {} };
let failed = false;

for (const store of stores) {
  const setStatus = (text) => console.log(`${store}: ${text}`);
  console.log(`${store}: ${options.dryRun ? 'validating credentials' : 'submitting'}`);
  try {
    if (store === 'chrome') {
      const chromeStore = new ChromeWebStoreV2(resolved.chrome, setStatus);
      await chromeStore.ensureZipsExist();
      await chromeStore.submit(options.dryRun);
    } else {
      const firefoxStore = new FirefoxAddonStoreV5(resolved.firefox, setStatus);
      await firefoxStore.ensureZipsExist();
      await firefoxStore.submit(options.dryRun);
    }
    summary.stores[store] = { submitted: !options.dryRun, error: null };
  } catch (error) {
    failed = true;
    summary.stores[store] = {
      submitted: false,
      error: redact(error?.message || error),
    };
    console.error(redact(error?.stack || error));
  }
}

fs.writeFileSync(options.summaryOut, `${JSON.stringify(summary, null, 2)}\n`);

for (const [store, result] of Object.entries(summary.stores)) {
  console.log(
    `${store}: ${
      result.error
        ? `FAILED - ${result.error}`
        : options.dryRun
          ? 'credentials OK (dry run, nothing uploaded)'
          : 'submitted for review'
    }`,
  );
}

process.exit(failed ? 1 : 0);
