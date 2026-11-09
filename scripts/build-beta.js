/* eslint-env node */
/* eslint-disable no-console, security/detect-non-literal-fs-filename -- CLI script: prints progress and resolves build output paths */
/**
 * Beta build: the same bundle as production with the beta artwork.
 *
 * The icons have to be swapped in `src/images` before the bundler runs, because
 * both the manifest and the runtime `new URL('../images/...', import.meta.url)`
 * references resolve to content-hashed files: replacing them after the build
 * would mean rewriting the manifest and the bundle. The originals are restored
 * in a `finally`, so a local run leaves no changes behind.
 *
 * The manifest is patched after the build:
 * - `version` gets a fourth part (`<version>.<BETA_VERSION_SUFFIX>`) so every
 *   automatic upload is a new store version (manifests allow four parts);
 * - Firefox gets its own add-on id, because AMO identifies an add-on by it and
 *   the beta listing is a separate item. Chrome items are keyed by the store
 *   item, so the same zip works for both.
 *
 * Usage: node scripts/build-beta.js --platform=chrome|firefox
 */
const fs = require('fs/promises');
const path = require('path');
const { execAsync } = require('./execAsync');

const API_ICON_SIZES = ['16', '32', '48', '128'];
const ICON_FILES = API_ICON_SIZES.flatMap((size) => [
  `logo-icon-${size}.png`,
  `logo-icon-${size}-disabled.png`,
]);

function parseArgs(argv) {
  const platform = argv
    .find((arg) => arg.startsWith('--platform='))
    ?.slice('--platform='.length);
  if (!['chrome', 'firefox'].includes(platform)) {
    console.error(
      'Usage: node scripts/build-beta.js --platform=chrome|firefox'
    );
    process.exit(1);
  }
  return { platform };
}

function versionSuffix() {
  const suffix = process.env.BETA_VERSION_SUFFIX;
  if (suffix == null) return null;
  if (!/^\d+$/.test(suffix) || Number(suffix) > 65535) {
    console.error(
      `BETA_VERSION_SUFFIX must be a number between 0 and 65535, got "${suffix}".`
    );
    process.exit(1);
  }
  return suffix;
}

async function buildBeta({ platform }) {
  const root = path.join(__dirname, '..');
  const images = path.join(root, 'src/images');
  const betaImages = path.join(images, 'beta');
  const backup = path.join(root, '.beta-icon-backup');
  const outDir = path.join(
    root,
    platform === 'firefox' ? 'dist-firefox' : 'dist'
  );

  await fs.mkdir(backup, { recursive: true });
  for (const file of ICON_FILES) {
    await fs.copyFile(path.join(images, file), path.join(backup, file));
  }
  try {
    for (const file of ICON_FILES) {
      await fs.copyFile(path.join(betaImages, file), path.join(images, file));
    }
    await execAsync(process.execPath, [
      path.join(
        __dirname,
        platform === 'firefox' ? 'build-firefox.js' : 'build.js'
      ),
    ]);
  } finally {
    for (const file of ICON_FILES) {
      await fs.copyFile(path.join(backup, file), path.join(images, file));
    }
    await fs.rm(backup, { recursive: true, force: true });
  }

  const manifestPath = path.join(outDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const { version } = require('../package.json');
  const suffix = versionSuffix();
  manifest.version = suffix ? `${version}.${suffix}` : version;
  if (platform === 'firefox') {
    manifest.browser_specific_settings = {
      ...manifest.browser_specific_settings,
      gecko: {
        ...manifest.browser_specific_settings?.gecko,
        id: 'beta@zerion.io',
      },
    };
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Done ${platform} beta (${manifest.version})`);
}

buildBeta(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
