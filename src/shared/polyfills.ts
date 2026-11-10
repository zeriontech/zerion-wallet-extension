/**
 * Node globals for bundled dependencies.
 *
 * Some transitive CJS dependencies (`readable-stream` via the stream/buffer
 * polyfills) read `process.browser`, `process.version` and `process.nextTick`
 * at module scope. `vite-plugin-node-polyfills` injects the shim into the
 * modules it transforms, but not into every chunk (workers and some async
 * chunks are missed), which surfaces as `process is not defined` at runtime.
 *
 * Importing this module first in each entry point installs the same shims on
 * `globalThis` before any dependency is evaluated.
 */
import bufferShim from 'vite-plugin-node-polyfills/shims/buffer';
import processShim from 'vite-plugin-node-polyfills/shims/process';

const globals = globalThis as typeof globalThis & {
  Buffer?: unknown;
  process?: unknown;
  global?: unknown;
};

globals.process ??= processShim;
globals.Buffer ??= bufferShim;
globals.global ??= globalThis;
