#!/usr/bin/env node

/**
 * `npm run version` — the script passed to `changesets/action` as
 * `version-script`.
 *
 * Runs `changeset version` (bumps package.json + CHANGELOG, deletes consumed
 * changesets) and then syncs the version into both extension manifests, so
 * `src/manifest-chrome.json` and `src/manifest-firefox.json` never drift from
 * package.json.
 *
 * `npm version <bump>` runs this script as its `version` lifecycle hook, after
 * npm has already bumped package.json. In that case `changeset version` would
 * bump a second time, so it is skipped and only the manifests are synced.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// `npm run version` -> npm_command=run; `npm version` -> npm_command=version.
const isNpmVersionLifecycle = process.env.npm_command === 'version';

if (!isNpmVersionLifecycle) {
  execFileSync(process.execPath, [require.resolve('@changesets/cli/bin.js'), 'version'], {
    cwd: root,
    stdio: 'inherit',
  });

  // Changesets' own auto-formatter looks for a formatter binary it knows; the
  // repo formats with Oxfmt through `vp`, so `format` is disabled in
  // .changeset/config.json and the changelog is formatted here instead.
  const changelog = path.join(root, 'CHANGELOG.md');
  if (fs.existsSync(changelog)) {
    execFileSync(path.join(root, 'node_modules/.bin/vp'), ['fmt', 'CHANGELOG.md'], {
      cwd: root,
      stdio: 'inherit',
    });
  }
}

execFileSync(process.execPath, [path.join(root, 'scripts/manifest-version.js')], {
  cwd: root,
  stdio: 'inherit',
});
