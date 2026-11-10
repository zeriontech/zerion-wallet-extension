#!/usr/bin/env node

/**
 * Builds the extension with Vite (Rolldown) through the `vp` CLI.
 *
 * One extension needs four bundles with different constraints, so this runs
 * `vp build` once per target (see `vite.config.ts`) and then composes the
 * manifest:
 *   pages          popup / sidepanel / ledger HTML, code-split
 *   background     single IIFE (MV3 service worker, classic for Firefox)
 *   content-script single IIFE + its stylesheet
 *   in-page        single IIFE, injected into the page's own world
 *
 * Usage:
 *   node scripts/build.mjs --platform=chrome [--out=dist]
 *   node scripts/build.mjs --platform=firefox [--out=dist-firefox]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

import { buildManifest, copyStatic, readBuildMeta } from './manifest.mjs';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const sourceRoot = path.join(projectRoot, 'src');
const vpBin = path.join(projectRoot, 'node_modules/.bin/vp');

export const BUILD_TARGETS = [
  'pages',
  'background',
  'content-script',
  'in-page',
];

/** Manifests allow at most four numeric version parts. */
function assertVersionSuffix(suffix) {
  if (!/^\d+$/.test(String(suffix)) || Number(suffix) > 65535) {
    throw new Error(
      `Version suffix must be a number between 0 and 65535, got "${suffix}".`
    );
  }
  return String(suffix);
}

/**
 * @param {object} options
 * @param {'chrome' | 'firefox'} options.platform
 * @param {string} options.outDir relative to the project root
 * @param {Record<string, string>} [options.env] extra build-time env
 * @param {'production' | 'development'} [options.mode] dev builds keep React
 *   dev mode, `development` branches and unminified output
 * @param {'production' | 'beta'} [options.brand] `beta` swaps the artwork for
 *   the coral beta icons and gives the Firefox build its own add-on id, so the
 *   beta listing is a separate store item fed by the same bundle
 * @param {string} [options.versionSuffix] fourth manifest version part, so each
 *   automatic beta upload is a new store version
 */
export function buildExtension({
  platform,
  outDir,
  env = {},
  mode = 'production',
  brand = 'production',
  versionSuffix,
}) {
  const absoluteOut = path.join(projectRoot, outDir);
  fs.rmSync(absoluteOut, { recursive: true, force: true });

  const sourceManifest = JSON.parse(
    fs.readFileSync(path.join(sourceRoot, `manifest-${platform}.json`), 'utf8')
  );

  for (const target of BUILD_TARGETS) {
    console.log(`Building ${platform} (${target})`); // eslint-disable-line no-console
    execFileSync(vpBin, ['build'], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env,
        PLATFORM: platform,
        BUILD_TARGET: target,
        BUILD_OUT: outDir,
        NODE_ENV: mode === 'development' ? 'development' : 'production',
      },
    });
  }

  const emitted = readBuildMeta(absoluteOut, BUILD_TARGETS);
  const manifest = buildManifest({
    source: sourceManifest,
    platform,
    emitted,
    outDir: absoluteOut,
  });

  copyStatic({ outDir: absoluteOut, sourceRoot });

  if (brand === 'beta') {
    // The bundle is identical to production apart from the artwork, so the
    // icons are replaced in the output (`images/` is copied verbatim) instead
    // of rebuilding with different sources.
    const betaIcons = path.join(sourceRoot, 'images/beta');
    for (const file of fs.readdirSync(betaIcons)) {
      fs.copyFileSync(
        path.join(betaIcons, file),
        path.join(absoluteOut, 'images', file)
      );
    }
    if (platform === 'firefox') {
      // AMO identifies an add-on by this id, and the beta listing is separate.
      manifest.browser_specific_settings = {
        ...manifest.browser_specific_settings,
        gecko: {
          ...manifest.browser_specific_settings?.gecko,
          id: 'beta@zerion.io',
        },
      };
    }
  }
  if (versionSuffix) {
    manifest.version = `${manifest.version}.${assertVersionSuffix(versionSuffix)}`;
  }
  fs.writeFileSync(
    path.join(absoluteOut, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  console.log(`Done ${platform}`); // eslint-disable-line no-console
  return manifest;
}

/**
 * Rebuild on every change under `src/`. A full rebuild takes ~2s, which is
 * cheaper than wiring per-target watchers for four bundles with different
 * formats; there is no HMR, so reload the extension after a rebuild.
 *
 * `watchExtension` is a development build: it loads `.env` (as Parcel did) and
 * runs `vp build` with `NODE_ENV=development`, so React dev warnings and the
 * `development` branches behave as they did before the migration.
 */
function watchExtension({ platform, outDir }) {
  dotenv.config();
  let timer;
  let building = false;
  let queued = false;
  const rebuild = () => {
    if (building) {
      // A save arrived mid-build; run again when this pass finishes.
      queued = true;
      return;
    }
    building = true;
    try {
      buildExtension({ platform, outDir, mode: 'development' });
    } catch (error) {
      console.error(error.message); // eslint-disable-line no-console
    } finally {
      building = false;
      if (queued) {
        queued = false;
        rebuild();
      }
    }
  };
  rebuild();
  console.log('Watching src/ for changes'); // eslint-disable-line no-console
  fs.watch(sourceRoot, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 200);
  });
}

function parseArgs(argv) {
  const options = {
    outDir: undefined,
    platform: undefined,
    watch: false,
    brand: 'production',
    versionSuffix: undefined,
  };
  for (const arg of argv) {
    if (arg.startsWith('--platform=')) options.platform = arg.slice(11);
    else if (arg.startsWith('--out=')) options.outDir = arg.slice(6);
    else if (arg.startsWith('--brand=')) options.brand = arg.slice(8);
    else if (arg.startsWith('--version-suffix='))
      options.versionSuffix = arg.slice('--version-suffix='.length);
    else if (arg === '--watch') options.watch = true;
    else {
      console.error(`Unknown argument: ${arg}`); // eslint-disable-line no-console
      process.exit(1);
    }
  }
  if (!['chrome', 'firefox'].includes(options.platform)) {
    console.error('Usage: node scripts/build.mjs --platform=chrome|firefox'); // eslint-disable-line no-console
    process.exit(1);
  }
  if (!['production', 'beta'].includes(options.brand)) {
    console.error('--brand must be production or beta'); // eslint-disable-line no-console
    process.exit(1);
  }
  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { platform, outDir, watch, brand, versionSuffix } = parseArgs(
    process.argv.slice(2)
  );
  const defaultOut =
    brand === 'beta'
      ? platform === 'firefox'
        ? 'dist-firefox-beta'
        : 'dist-beta'
      : platform === 'firefox'
        ? 'dist-firefox'
        : 'dist';
  const resolvedOut = outDir ?? defaultOut;
  if (watch) {
    watchExtension({ platform, outDir: resolvedOut });
  } else {
    buildExtension({ platform, outDir: resolvedOut, brand, versionSuffix });
  }
}
