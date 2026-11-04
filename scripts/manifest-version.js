/* eslint-env node */
const fs = require('fs/promises');
const path = require('path');
const { version } = require('../package.json');
const manifestChrome = require('../src/manifest-chrome.json');
const manifestFirefox = require('../src/manifest-firefox.json');
const { execAsync } = require('./execAsync');

const src = path.join(__dirname, '../src');

function toManifestVersion(version) {
  // turns value like "v1.0.1-alpha.23" to "1.0.0.23"
  return version.replace(/[^\d.]+/g, '');
}

async function syncVersion() {
  await fs.writeFile(
    path.join(src, 'manifest-chrome.json'),
    JSON.stringify(
      {
        ...manifestChrome,
        version: toManifestVersion(version),
      },
      null,
      2
    )
  );
  await fs.writeFile(
    path.join(src, 'manifest-firefox.json'),
    JSON.stringify(
      {
        ...manifestFirefox,
        version: toManifestVersion(version),
      },
      null,
      2
    )
  );

  await execAsync('./node_modules/.bin/prettier', [
    '--write',
    'src/manifest-chrome.json',
  ]);
  await execAsync('./node_modules/.bin/prettier', [
    '--write',
    'src/manifest-firefox.json',
  ]);
}

syncVersion();
