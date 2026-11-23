import { plugin } from 'bun';

/**
 * Bun-side Vite compatibility for the unit suite (spike/bun-test).
 *
 * 1. Vite treats CSS, SVG and `jsx:` (SVGR) imports as modules; Bun has no
 *    loader for them. Tests never assert on styles or render icons, so they
 *    resolve to inert stubs.
 * 2. `vi.mock()` must run before the spec's static imports. Bun only hoists
 *    `mock.module()` calls, so specs are rewritten to call it directly; that
 *    also makes relative mock specifiers resolve against the spec file.
 */
export default function vitestCompatPlugin() {
  return {
    name: 'vitest-compat',
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, () => ({
        contents: 'export default {};',
        loader: 'js',
      }));
      build.onLoad({ filter: /\.(svg|png|jpe?g|gif|webp|woff2?|ttf|otf)$/ }, () => ({
        contents: 'export default "asset";',
        loader: 'js',
      }));
      build.onLoad({ filter: /^jsx:/ }, () => ({
        contents: 'export default function Asset() { return null; }',
        loader: 'jsx',
      }));
    },
  };
}
