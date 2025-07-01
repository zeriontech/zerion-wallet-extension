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

  /** Add changes to previous commit, which is a commit made by `npm run version` */
  const tag = `v${version}`;
  await execAsync('git', ['tag', '--delete', tag]);
  await execAsync('git', ['add', '.']);
  await execAsync('git', ['commit', '--amend', '--no-edit']);
  // Add --message flag because that is what `npm version` does under the hood:
  // https://github.com/npm/cli/blob/c52cf6bc547268833cde2715fe4f6299240049f8/workspaces/libnpmversion/lib/tag.js#L22
  // It also creates an "annotated" tag instead of a "lightweight" tag.
  // Only "annotated" tags are picked up by `git push --follow-tags`
  await execAsync('git', ['tag', tag, '--message', version]);
}

syncVersion();
