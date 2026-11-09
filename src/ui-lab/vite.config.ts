import path from 'node:path';

import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vite-plus';

import {
  componentsAlias,
  parcelSchemePlugin,
  sourceAlias,
} from '../../scripts/vite-plugins';

/**
 * Dev-only playground for the ui-kit. Replaces the Parcel config that used the
 * named-pipeline aliases from package.json: the mocks below stand in for the
 * background/networks/channels modules the components expect.
 */
const projectRoot = path.resolve(__dirname, '../..');
const sourceRoot = path.join(projectRoot, 'src');

export default defineConfig({
  root: __dirname,
  publicDir: false,
  plugins: [
    parcelSchemePlugin({ projectRoot }),
    react(),
    svgr(),
    nodePolyfills({ globals: { Buffer: true, global: true, process: true } }),
  ],
  resolve: {
    alias: [
      sourceAlias(sourceRoot),
      componentsAlias(projectRoot),
      {
        find: /^src\/ui\/shared\/channels$/,
        replacement: path.join(sourceRoot, 'ui/shared/channels.mock.ts'),
      },
      {
        find: /^src\/modules\/networks\/networks-store\.client$/,
        replacement: path.join(
          sourceRoot,
          'modules/networks/networks-store.client.mock.ts'
        ),
      },
      {
        find: /^src\/background\/constants$/,
        replacement: path.join(sourceRoot, 'background/constants.mock.ts'),
      },
      {
        find: /^webextension-polyfill$/,
        replacement: path.join(
          sourceRoot,
          'ui-lab/webextension-polyfill.mock.ts'
        ),
      },
    ],
  },
});
