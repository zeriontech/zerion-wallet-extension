import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it as bunIt,
  jest,
  mock,
  test as bunTest,
} from 'bun:test';

/**
 * Vitest-compatible surface on top of `bun:test`, for the `spike/bun-test`
 * runner experiment. Only the API this repository's specs use is implemented:
 * `vi.fn|spyOn|mocked|hoisted|mock|stubGlobal|unstubAllGlobals|setConfig` and the
 * fake-timer helpers.
 *
 * `vi.mock` maps to `mock.module`. Bun applies module mocks lazily, so a mock
 * registered after the static imports of a spec still affects the code under
 * test, and relative specifiers resolve against the importing spec.
 */

let testTimeout;
const stubbings = new Map();

const timed = (register) => (name, fn, options) => {
  const timeout = options?.timeout ?? testTimeout;
  return register(name, fn, timeout == null ? options : { ...options, timeout });
};

/** `test`/`it`, carrying Bun's modifiers so `test.each(...)` keeps working. */
function withTimeout(register) {
  const wrapped = timed(register);
  for (const key of Object.keys(register)) {
    wrapped[key] = register[key];
  }
  return wrapped;
}

export const test = withTimeout(bunTest);
export const it = withTimeout(bunIt);

export const vi = {
  fn: (...args) => jest.fn(...args),
  spyOn: (...args) => jest.spyOn(...args),
  /** Type-level helper in Vitest; the runtime value is the mock itself. */
  mocked: (value) => value,
  hoisted: (factory) => factory(),
  mock: (specifier, factory) => {
    mock.module(specifier, factory);
  },
  stubGlobal: (name, value) => {
    if (!stubbings.has(name)) {
      stubbings.set(name, globalThis[name]);
    }
    globalThis[name] = value;
  },
  unstubAllGlobals: () => {
    for (const [name, value] of stubbings) {
      globalThis[name] = value;
    }
    stubbings.clear();
  },
  useFakeTimers: (...args) => jest.useFakeTimers(...args),
  useRealTimers: () => jest.useRealTimers(),
  advanceTimersByTime: (ms) => jest.advanceTimersByTime(ms),
  runAllTimers: () => jest.runAllTimers(),
  clearAllMocks: () => jest.clearAllMocks(),
  resetAllMocks: () => jest.resetAllMocks(),
  restoreAllMocks: () => jest.restoreAllMocks(),
  /** Vitest per-file config; only the test timeout is observable here. */
  setConfig: (config = {}) => {
    testTimeout = config.testTimeout ?? testTimeout;
  },
};

export { afterAll, afterEach, beforeAll, beforeEach, describe, expect };
