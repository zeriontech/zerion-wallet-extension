/* eslint-env node */
const { execAsync } = require('./execAsync');

async function build() {
  console.log('Building Firefox'); // eslint-disable-line no-console

  await execAsync('rm', ['-rf', '.parcel-cache-firefox', 'dist-firefox']);
  await execAsync('cp', ['./src/manifest-firefox.json', './src/manifest.json']);
  let env = Object.assign({}, process.env, { PLATFORM: 'firefox' });
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
      '--dist-dir',
      'dist-firefox',
      '--cache-dir',
      '.parcel-cache-firefox',
    ],
    { env }
  );

  console.log('Done Firefox'); // eslint-disable-line no-console
}

build();
