import fs from 'node:fs';
import path from 'node:path';

/**
 * Composes the built manifest from `src/manifest-<platform>.json`.
 *
 * The source manifest points at sources (`background/index.ts`,
 * `content-script/index.ts`, `content-script/in-page.ts`); the built one points
 * at the emitted bundles and carries the extra fields a bundler has to add:
 * - `content_scripts[].css` when the content script imports CSS,
 * - `web_accessible_resources` for assets the content script loads at runtime.
 *
 * Mirrors what `@parcel/config-webextension` produced, without the content
 * hashes.
 */
export function buildManifest({ source, platform, emitted }) {
  const manifest = structuredClone(source);

  if (platform === 'firefox') {
    // Firefox MV3 does not support module service workers; both platforms get
    // the IIFE bundle.
    manifest.background = { scripts: ['background.js'] };
  } else {
    manifest.background = { service_worker: 'background.js' };
  }

  const contentScript = manifest.content_scripts?.[0];
  if (!contentScript) {
    throw new Error('manifest.content_scripts[0] is missing');
  }
  contentScript.js = ['content-script.js'];
  if (emitted['content-script'].includes('content-script.css')) {
    contentScript.css = ['content-script.css'];
  }

  const pageWorld = manifest.web_accessible_resources?.[0];
  if (!pageWorld) {
    throw new Error('manifest.web_accessible_resources[0] is missing');
  }
  pageWorld.resources = ['in-page.js'];

  // Assets imported by the content script are injected into pages, so the
  // browser only serves them if they are web-accessible.
  const contentScriptAssets = emitted['content-script'].filter(
    (file) => !/\.(js|css|map)$/.test(file)
  );
  if (contentScriptAssets.length > 0) {
    manifest.web_accessible_resources.push({
      matches: contentScript.matches,
      resources: contentScriptAssets,
    });
  }

  return manifest;
}

export function readBuildMeta(outDir, targets) {
  const emitted = {};
  for (const target of targets) {
    const metaPath = path.join(outDir, `.build-${target}.json`);
    emitted[target] = JSON.parse(fs.readFileSync(metaPath, 'utf8')).files;
    fs.rmSync(metaPath, { force: true });
  }
  return emitted;
}

export function copyStatic({ outDir, sourceRoot }) {
  fs.cpSync(path.join(sourceRoot, '_locales'), path.join(outDir, '_locales'), {
    recursive: true,
  });
  fs.cpSync(path.join(sourceRoot, 'images'), path.join(outDir, 'images'), {
    recursive: true,
  });
}
