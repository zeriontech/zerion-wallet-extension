/* eslint-env node */
const fs = require('fs/promises');
const path = require('path');
const { version } = require('../package.json');
const manifest = require('../src/manifest.json');
const { execAsync } = require('./execAsync');

const src = path.join(__dirname, '../src');

function toManifestVersion(version) {
  // turns value like "v1.0.1-alpha.23" to "1.0.0.23"
  return version.replace(/[^\d.]+/g, '');
}

async function syncVersion() {
  await fs.writeFile(
    path.join(src, 'manifest.json'),
    JSON.stringify(
      {
        ...manifest,
        version: toManifestVersion(version),
      },
      null,
      2
    )
  );
  await execAsync('./node_modules/.bin/prettier --write src/manifest.json');

  /** Add changes to previous commit, which is a commit made by `npm run version` */
  const tag = `v${version}`;
  await execAsync(`git tag --delete ${tag}`);
  await execAsync('git add .');
  await execAsync('git commit --amend --no-edit');
  await execAsync(`git tag ${tag}`);
}

syncVersion();
