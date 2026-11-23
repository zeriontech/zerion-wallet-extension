import { plugin } from 'bun';

/**
 * Bun-side Vite compatibility for the unit suite (spike/bun-test).
 *
 * Vite treats CSS, SVG and `jsx:` (SVGR) imports as modules; Bun has no loader
 * for them. Tests never assert on styles or render icons, so they resolve to
 * inert stubs.
 *
 * Module mocks are not handled here on purpose: Bun 1.4.1 does not hoist
 * `mock.module` above a spec's imports (see the PR body), and rewriting specs to
 * call it directly was measured to fail the same way.
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
