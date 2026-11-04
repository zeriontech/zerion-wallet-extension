#!/usr/bin/env node

/**
 * Creates and pushes the annotated release tag for the version in package.json.
 *
 * Tagging belongs to CI: `scripts/manifest-version.js` only syncs the
 * manifests. This script runs from `version-packages.yml` after the Version
 * Packages PR merges, and the tag it pushes is what triggers `release.yml` and
 * `release_push_qa.yml`.
 *
 * The push must use a GitHub App token (`RELEASE_APP_ID` /
 * `RELEASE_APP_PRIVATE_KEY`), never `GITHUB_TOKEN`:
 *   - pushes made with `GITHUB_TOKEN` do not trigger other workflows;
 *   - the org ruleset `hive-protect-tags` only allows tag creation by its
 *     bypass actors, and the app is one of them.
 *
 * Usage: node scripts/release/tag-version.mjs [--dry-run]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const repo = process.env.GITHUB_REPOSITORY;
const sha =
  process.env.GITHUB_SHA ||
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const { version } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
);
const tag = `v${version}`;

const RULESET_HELP =
  'Automated tagging requires the GitHub App from RELEASE_APP_ID to be a bypass actor ' +
  'on the "hive-protect-tags" ruleset and to have contents: write on ' +
  `${repo || '<repo>'}.`;

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

if (!repo) fail('GITHUB_REPOSITORY is required.');

function remoteTagExists() {
  if (token) {
    try {
      execFileSync('gh', ['api', `repos/${repo}/git/ref/tags/${tag}`], {
        stdio: 'ignore',
        env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: '' },
      });
      return true;
    } catch {
      // Fall through to git: the tag may exist even if the API call fails.
    }
  }
  const output = execFileSync(
    'git',
    ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`],
    { encoding: 'utf8' }
  );
  return output.trim().length > 0;
}

if (remoteTagExists()) {
  console.log(`Tag ${tag} already exists on ${repo}; nothing to do.`);
  process.exit(0);
}

if (dryRun) {
  console.log(
    `[dry-run] Would create annotated tag ${tag} at ${sha} and push it to ${repo}.`
  );
  process.exit(0);
}

if (!token)
  fail(
    `GH_TOKEN or GITHUB_TOKEN is required to push the release tag. ${RULESET_HELP}`
  );

// GitHub masks this value in the log; also mask it for the shell.
process.stdout.write(`::add-mask::${token}\n`);

try {
  execFileSync('git', ['tag', '--annotate', tag, sha, '--message', tag], {
    stdio: 'pipe',
  });
} catch (error) {
  const stderr = String(error.stderr || '').replaceAll(token, '***');
  fail(`Could not create tag ${tag}: ${stderr}`);
}

// Authenticate the push through GIT_ASKPASS so the token is never in argv.
const askpassPath = path.join(os.tmpdir(), `askpass-${process.pid}.sh`);
fs.writeFileSync(
  askpassPath,
  '#!/bin/sh\ncase "$1" in\n  *Username*) echo "x-access-token" ;;\n  *Password*) echo "$GIT_PUSH_TOKEN" ;;\nesac\n',
  { mode: 0o700 }
);

try {
  execFileSync(
    'git',
    ['push', `https://github.com/${repo}.git`, `refs/tags/${tag}`],
    {
      stdio: 'pipe',
      env: {
        ...process.env,
        GIT_ASKPASS: askpassPath,
        GIT_TERMINAL_PROMPT: '0',
        GIT_PUSH_TOKEN: token,
      },
    }
  );
  console.log(`Pushed tag ${tag}.`);
} catch (error) {
  const stderr = String(error.stderr || '').replaceAll(token, '***');
  fail(`Failed to push tag ${tag}. ${RULESET_HELP} Git said: ${stderr}`);
} finally {
  fs.rmSync(askpassPath, { force: true });
}
