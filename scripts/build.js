/* eslint-env node */
const { execAsync } = require('./execAsync');

async function build() {
  console.log('Building Chrome'); // eslint-disable-line no-console

  await execAsync('rm', ['-rf', '.parcel-cache', 'dist']);
  await execAsync('cp', ['./src/manifest-chrome.json', './src/manifest.json']);

  let env = Object.assign({}, process.env, { PLATFORM: 'chrome' });
  await execAsync(
    // pass --no-content-hash flag to avoid code-splitting issues:
    // https://github.com/parcel-bundler/parcel/issues/8071#issuecomment-1214438848
    // https://github.com/parcel-bundler/parcel/issues/8071#issuecomment-1133549719
    './node_modules/.bin/parcel',
    [
      'build',
      'src/manifest.json',
      'src/ui/hardware-wallet/ledger.html',
      '--no-content-hash',
      '--no-source-maps',
    ],
    { env }
  );

  console.log('Done Chrome'); // eslint-disable-line no-console
}

build();
