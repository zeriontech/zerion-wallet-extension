/* eslint-env node */
/* eslint-disable no-console, security/detect-non-literal-fs-filename -- CLI script: prints progress and resolves build output paths */
/**
 * Beta build: the production build, then the icon assets are exchanged in the
 * finished bundle.
 *
 * The bundler runs exactly as it does for production (`scripts/build.js` /
 * `scripts/build-firefox.js`), so the ZIP is the production ZIP with different
 * PNGs inside — the manifest, the JS and every other asset stay byte-identical.
 * The icon files are content-hashed by Parcel and referenced from the manifest
 * and from `new URL('../images/…', import.meta.url)` calls, so they are
 * overwritten in place, keeping their names.
 *
 * After the swap the manifest is patched:
 * - `version` gets a fourth part (`<version>.<BETA_VERSION_SUFFIX>`) so every
 *   automatic upload is a new store version (manifests allow four parts);
 * - Firefox gets `beta@zerion.io`, because AMO identifies an add-on by that id
 *   and the beta listing is a separate item. Chrome items are keyed by the
 *   store item, so the same ZIP works for both.
 *
 * Usage: node scripts/build-beta.js --platform=chrome|firefox
 */
const fs = require('fs/promises');
const path = require('path');
const { execAsync } = require('./execAsync');

const ICON_SIZES = ['16', '32', '48', '128'];

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

/** Replaces every emitted icon file, content-hashed name included. */
async function replaceIcons(outDir) {
  const betaImages = path.join(__dirname, '../src/images/beta');
  const entries = await fs.readdir(outDir);
  let replaced = 0;
  for (const file of entries) {
    if (!file.startsWith('logo-icon-') || !file.endsWith('.png')) continue;
    const [size, ...rest] = file
      .slice('logo-icon-'.length)
      .split('.')[0]
      .split('-');
    if (!ICON_SIZES.includes(size)) continue;
    const disabled = rest.includes('disabled') ? '-disabled' : '';
    const source = path.join(betaImages, `logo-icon-${size}${disabled}.png`);
    await fs.copyFile(source, path.join(outDir, file));
    replaced += 1;
  }
  if (replaced === 0) {
    throw new Error(`No icon assets found in ${outDir}; did the build run?`);
  }
  return replaced;
}

async function buildBeta({ platform }) {
  const root = path.join(__dirname, '..');
  const outDir = path.join(
    root,
    platform === 'firefox' ? 'dist-firefox' : 'dist'
  );

  // Same build as production, unchanged.
  await execAsync(process.execPath, [
    path.join(
      __dirname,
      platform === 'firefox' ? 'build-firefox.js' : 'build.js'
    ),
  ]);

  const manifestPath = path.join(outDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  // Manifest icons first (these are the ones the browser shows), then the rest
  // of the emitted icon assets (the disabled variants used by the toolbar).
  for (const size of ICON_SIZES) {
    const iconPath = manifest.icons?.[size];
    if (!iconPath) continue;
    await fs.copyFile(
      path.join(root, 'src/images/beta', `logo-icon-${size}.png`),
      path.join(outDir, iconPath)
    );
  }
  await replaceIcons(outDir);

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
