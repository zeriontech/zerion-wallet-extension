/**
 * This whole file exists only for one purpose:
 * Modify manifest.json for production (i.e. remove http:// content_scripts policy),
 * run parcel build with updated manifest.json,
 * then modify manifest.json to its original state
 *
 * This is awful, but seems to be the only workaround
 * unless this gets implemented:
 * https://github.com/parcel-bundler/parcel/issues/8594
 *
 * Ideally, if manifest.json could be provided as arg, the command would be
 * "parcel build src/manifest.json --no-content-hash"
 */

/* eslint-env node */
const fs = require('fs/promises');
const path = require('path');
const originalManifest = require('../src/manifest.json');
const { execAsync } = require('./execAsync');

const productionManifest = {
  ...originalManifest,
  content_scripts: originalManifest.content_scripts.map((entry) => ({
    ...entry,
    matches: entry.matches.filter((pattern) => !pattern.startsWith('http://*')),
  })),
};

const src = path.join(__dirname, '../src');

async function buildWithProductionManifest() {
  // eslint-disable-next-line no-console
  console.log('Creating production version of manifest.json');
  await fs.copyFile(
    path.join(src, 'manifest.json'),
    path.join(src, 'manifest-original.json')
  );
  await fs.writeFile(
    path.join(src, 'manifest.json'),
    JSON.stringify(productionManifest, null, 2)
  );

  console.log('Building'); // eslint-disable-line no-console
  try {
    await execAsync('rm -rf .parcel-cache dist');
    await execAsync(
      './node_modules/.bin/parcel build src/manifest.json --no-content-hash'
    );
  } finally {
    console.log('Tidying up'); // eslint-disable-line no-console
    await fs.writeFile(
      path.join(src, 'manifest.json'),
      JSON.stringify(originalManifest, null, 2)
    );
    await execAsync('./node_modules/.bin/prettier --write src/manifest.json');
    await fs.unlink(path.join(src, 'manifest-original.json'));
  }

  console.log('Done'); // eslint-disable-line no-console
}

buildWithProductionManifest();
