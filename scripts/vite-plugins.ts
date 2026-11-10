import fs from 'node:fs';
import path from 'node:path';

/**
 * Parcel import conventions still used by the sources:
 *
 * - `jsx:<path>` returns a React component (SVGR).
 * - `url:<path>` returns the asset URL.
 * - `data-url:<path>` returns the asset inlined as a data URI.
 * - `<specifier>.worker` without an extension is a TypeScript worker.
 *
 * `src/...` specifiers are resolved from the project root, relative ones from
 * the importing module. Keeping this in a plugin means the ~470 scheme imports
 * in `src/**` did not have to be rewritten during the Vite migration.
 */
export function parcelSchemePlugin({ projectRoot }: { projectRoot: string }) {
  return {
    name: 'parcel-schemes',
    enforce: 'pre' as const,
    resolveId(id: string, importer?: string) {
      const scheme = ['jsx:', 'url:', 'data-url:'].find((prefix) => id.startsWith(prefix));
      if (!scheme) return null;
      const specifier = id.slice(scheme.length);
      const assetPath =
        specifier.startsWith('.') && importer
          ? path.resolve(path.dirname(importer), specifier)
          : path.resolve(projectRoot, specifier);
      if (scheme === 'jsx:') return `${assetPath}?react`;
      if (scheme === 'data-url:') return `${assetPath}?inline`;
      if (specifier.endsWith('.worker') && fs.existsSync(`${assetPath}.ts`)) {
        return `${assetPath}.ts?worker&url`;
      }
      return assetPath;
    },
  };
}

export const sourceAlias = (sourceRoot: string) => ({
  find: /^src\//,
  replacement: `${sourceRoot}/`,
});

/**
 * `@zeriontech/components` only exports its root, but the ui-kit imports
 * `lib/Toggle`, `lib/UIText` and `lib/style.css`. Parcel resolved those files
 * directly; map them explicitly instead of widening every import.
 */
export const componentsAlias = (projectRoot: string) => ({
  find: /^@zeriontech\/components\/lib\//,
  replacement: path.join(projectRoot, 'node_modules/@zeriontech/components/lib/'),
});
