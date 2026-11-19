#!/usr/bin/env node

/**
 * E2E preflight for the ZPI development token.
 *
 * The e2e build routes API traffic through `e2e/proxy.mjs`, which answers the
 * Cloudflare challenge with `ZERION_API_DEVELOPMENT_KEY` (or
 * `CF_ZPI_DEV_BYPASS_SECRET`). Without it, approval windows can hang on loading
 * states when ZPI challenges the request.
 *
 * Worktrees do not inherit the main checkout's ignored `.env`, so when the
 * current worktree has no token this script copies `.env` from the main
 * worktree (or appends the token lines when a `.env` already exists). It never
 * prints file contents or token values — only whether the key is present.
 *
 * Usage:
 *   node scripts/ensure-e2e-env.mjs
 *
 * Escape hatch: `E2E_ALLOW_NO_TOKEN=1` continues without the token (tests then
 * talk to ZPI directly and may hit the Cloudflare challenge).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const TOKEN_KEYS = ['ZERION_API_DEVELOPMENT_KEY', 'CF_ZPI_DEV_BYPASS_SECRET'];
// GitHub Actions, not `CI`: agent shells on a dev machine often export CI=true.
const isCI = process.env.GITHUB_ACTIONS === 'true';
const tokenLine = new RegExp(`^\\s*(?:${TOKEN_KEYS.join('|')})\\s*=\\s*\\S+`, 'm');
const anyKeyLine = new RegExp(`^\\s*(?:${TOKEN_KEYS.join('|')})\\s*=`, 'm');

const readIfExists = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
};

/** The main checkout is the first entry in `git worktree list`. */
function mainWorktree(cwd) {
  try {
    const output = execFileSync('git', ['-C', cwd, 'worktree', 'list', '--porcelain'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const first = output.split('\n').find((line) => line.startsWith('worktree '));
    return first ? first.slice('worktree '.length) : undefined;
  } catch {
    return undefined;
  }
}

function sourceCandidates(cwd) {
  const candidates = [];
  if (process.env.E2E_ENV_SOURCE) candidates.push(path.resolve(cwd, process.env.E2E_ENV_SOURCE));
  const main = mainWorktree(cwd);
  if (main) candidates.push(path.join(main, '.env'));
  return candidates;
}

function tokenLines(text) {
  return text.split(/\r?\n/).filter((line) => anyKeyLine.test(line) && tokenLine.test(line));
}

/**
 * @returns {{ ok: true, message: string } | { ok: false, message: string }}
 */
export function ensureE2eEnv({ cwd = process.cwd() } = {}) {
  const fromEnvironment = TOKEN_KEYS.filter((key) => process.env[key]);
  if (fromEnvironment.length > 0) {
    return {
      ok: true,
      message: `E2E token present in the environment (${fromEnvironment.join(', ')}).`,
    };
  }

  const target = path.join(cwd, '.env');
  const targetText = readIfExists(target);
  if (targetText && tokenLine.test(targetText)) {
    return { ok: true, message: 'E2E token present in .env.' };
  }

  for (const source of sourceCandidates(cwd)) {
    if (path.resolve(source) === path.resolve(target)) continue;
    const sourceText = readIfExists(source);
    if (!sourceText || !tokenLine.test(sourceText)) continue;

    const lines = tokenLines(sourceText);
    if (!targetText) {
      fs.copyFileSync(source, target);
      return {
        ok: true,
        message: `Copied .env from ${source} into this worktree (token not printed).`,
      };
    }

    fs.appendFileSync(target, `${targetText.endsWith('\n') ? '' : '\n'}${lines.join('\n')}\n`);
    return {
      ok: true,
      message: `Appended the E2E token from ${source} to the existing .env (value not printed).`,
    };
  }

  return {
    ok: false,
    message: [
      'E2E preflight: ZERION_API_DEVELOPMENT_KEY is missing.',
      `Looked in ${target} and in the main checkout${sourceCandidates(cwd)[0] ? ` (${sourceCandidates(cwd)[0]})` : ''}.`,
      'Copy the token from the main repo .env without printing it, or ask the user for it.',
      'Set E2E_ALLOW_NO_TOKEN=1 to run without the local proxy (Cloudflare may block approval windows).',
    ].join('\n'),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = ensureE2eEnv();
  if (result.ok) {
    console.log(result.message); // eslint-disable-line no-console
    process.exit(0);
  }

  if (isCI) {
    console.log('CI: no local .env; the token comes from the job environment.'); // eslint-disable-line no-console
    process.exit(0);
  }

  if (process.env.E2E_ALLOW_NO_TOKEN === '1') {
    console.warn(result.message); // eslint-disable-line no-console
    process.exit(0);
  }

  console.error(result.message); // eslint-disable-line no-console
  process.exit(1);
}
