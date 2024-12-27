/* eslint-env node */
const { execAsync } = require('./execAsync');

async function build() {
  console.log('Building'); // eslint-disable-line no-console

  await execAsync('rm -rf .parcel-cache dist');
  await execAsync(
    // pass --no-content-hash flag to avoid code-splitting issues:
    // https://github.com/parcel-bundler/parcel/issues/8071#issuecomment-1214438848
    // https://github.com/parcel-bundler/parcel/issues/8071#issuecomment-1133549719
    //
    // pass --no-scope-hoist to fix re_export error with ethers@v6 ($re_export$ethers is not defined)
    // https://github.com/parcel-bundler/parcel/issues/4796#issuecomment-658283698
    './node_modules/.bin/parcel build src/manifest.json src/ui/hardware-wallet/ledger.html --no-content-hash --no-source-maps'
  );

  console.log('Done'); // eslint-disable-line no-console
}

build();
