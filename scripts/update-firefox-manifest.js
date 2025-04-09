/* eslint-env node */
const fs = require('fs/promises');
const path = require('path');
const manifest = require('../dist/manifest.json');

const dist = path.join(__dirname, '../dist');

async function updateFirefoxManifest(manifestDir) {
  await fs.writeFile(
    path.join(manifestDir, 'manifest.json'),
    JSON.stringify(
      {
        ...manifest,
        background: { scripts: [manifest.background.service_worker] },
        browser_specific_settings: {
          gecko: {
            id: 'zerts@zerion.io',
            strict_min_version: '115.0',
          },
        },
      },
      null,
      2
    )
  );
}

updateFirefoxManifest(dist);
