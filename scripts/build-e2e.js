/* eslint-env node */
/* eslint-disable security/detect-non-literal-fs-filename -- scans the build output directory */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execAsync } = require('./execAsync');

dotenv.config();

const PROXY_PORT = process.env.E2E_PROXY_PORT || '4789';
const PROXY_BASE = `http://127.0.0.1:${PROXY_PORT}`;
const SECRETS = [
  ...new Set(
    [
      process.env.ZERION_API_DEVELOPMENT_KEY,
      process.env.CF_ZPI_DEV_BYPASS_SECRET,
    ].filter(Boolean)
  ),
];

// With a bypass secret, route API traffic through the local proxy so the
// secret never enters Chromium. Without one (local development), call ZPI
// directly — there is no secret to protect.
const USE_PROXY = SECRETS.length > 0 || process.env.E2E_USE_PROXY === '1';

// Public wallet from e2e/fixtures/constants.ts. E2E always onboards this
// wallet; it must not depend on a CI secret.
const TEST_WALLET_ADDRESS = '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1';

// Scan in-process so the secret never appears in subprocess arguments or in
// a subprocess error message.
function containsSecret(directory, secret) {
  const needle = Buffer.from(secret);
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(file);
        continue;
      }
      // Fail closed on symlinks and other non-regular files.
      if (!entry.isFile()) {
        return true;
      }
      if (fs.readFileSync(file).includes(needle)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * E2E-only build. It differs from the production build in three ways:
 * - Output goes to dist-e2e and never leaves the runner.
 * - Feature flags and the test wallet are pinned, so snapshots do not depend
 *   on workflow configuration.
 * - API traffic goes through the local proxy (see e2e/proxy.mjs) when a
 *   Cloudflare bypass secret is configured, so the secret is never compiled
 *   into the extension.
 */
async function build() {
  // eslint-disable-next-line no-console
  console.log(
    `Building E2E extension (API target: ${
      USE_PROXY ? 'local proxy' : 'direct ZPI'
    })`
  );

  await execAsync('rm', ['-rf', '.parcel-cache-e2e', 'dist-e2e']);
  await execAsync('cp', ['./src/manifest-chrome.json', './src/manifest.json']);

  const env = {
    ...process.env,
    PLATFORM: 'chrome',
    ZERION_API_URL: USE_PROXY ? `${PROXY_BASE}/zpi/` : 'https://zpi.zerion.io/',
    ZERION_TESTNET_API_URL: USE_PROXY
      ? `${PROXY_BASE}/zpi-testnet/`
      : 'https://zpi-testnet.zerion.io/',
    BACKEND_ENV: '',
    PROXY_URL: 'https://proxy.zerion.io/',
    DEFI_SDK_TRANSACTIONS_API_URL: 'https://transactions.zerion.io',
    TEST_WALLET_ADDRESS,
    MIXPANEL_TOKEN_PUBLIC: '',
    GOOGLE_ANALYTICS_MEASUREMENT_ID: '',
    GOOGLE_ANALYTICS_API_SECRET: '',
    FEATURE_SEND_FORM: 'on',
    FEATURE_BRIDGE_FORM: 'on',
    FEATURE_LOYALTY_FLOW: 'off',
    FEATURE_SOLANA: 'on',
  };
  // Defence in depth: never let the bypass secret reach the bundler.
  delete env.ZERION_API_DEVELOPMENT_KEY;
  delete env.CF_ZPI_DEV_BYPASS_SECRET;

  await execAsync(
    './node_modules/.bin/parcel',
    [
      'build',
      'src/manifest.json',
      'src/ui/hardware-wallet/ledger.html',
      '--no-content-hash',
      '--no-source-maps',
      '--dist-dir',
      'dist-e2e',
      '--cache-dir',
      '.parcel-cache-e2e',
    ],
    { env }
  );

  for (const secret of SECRETS) {
    if (containsSecret('dist-e2e', secret)) {
      throw new Error(
        'E2E build contains the Cloudflare bypass secret. Refusing to continue.'
      );
    }
  }

  console.log('Done E2E'); // eslint-disable-line no-console
}

build().catch((error) => {
  console.error(error); // eslint-disable-line no-console
  process.exit(1);
});
