import '../../vitest.setup';
import { plugin } from 'bun';
import { mock } from 'bun:test';
import * as vitestShim from './vitest-shim.mjs';
import vitestCompatPlugin from './plugin.mjs';

// The extension polyfill throws at import time unless `chrome.runtime.id`
// exists. Faking the rest of the extension API would turn every unmocked module
// into a partially-working environment, which masks the real blocker (mocks
// registered after the spec's imports); the failures are reported instead.

plugin(vitestCompatPlugin());

// Ten specs import `expect`/`vi` explicitly from `vite-plus/test` (the Vitest
// re-export this repo uses) instead of relying on the injected globals.
mock.module('vite-plus/test', () => vitestShim);

// vite.config.ts sets `test.globals: true`; every other spec uses bare globals.
Object.assign(globalThis, {
  describe: vitestShim.describe,
  test: vitestShim.test,
  it: vitestShim.it,
  expect: vitestShim.expect,
  beforeEach: vitestShim.beforeEach,
  afterEach: vitestShim.afterEach,
  beforeAll: vitestShim.beforeAll,
  afterAll: vitestShim.afterAll,
  vi: vitestShim.vi,
});
