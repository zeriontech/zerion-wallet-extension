import { describe, expect, it, vi } from 'vite-plus/test';
import type { OffscreenSolverDeps } from './OffscreenSolver';
import { OffscreenSolver } from './OffscreenSolver';

function setup(overrides: Partial<OffscreenSolverDeps> = {}) {
  const deps: OffscreenSolverDeps = {
    isAvailable: vi.fn(() => true),
    hasDocument: vi.fn(async () => false),
    createDocument: vi.fn(async () => {}),
    closeDocument: vi.fn(async () => {}),
    ...overrides,
  };
  return { deps, solver: new OffscreenSolver(deps, 1000) };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('OffscreenSolver', () => {
  it('resolves true and closes the document when the offscreen page reports a token', async () => {
    const { deps, solver } = setup();
    const attempt = solver.attempt();
    await flush();

    expect(deps.createDocument).toHaveBeenCalledTimes(1);
    solver.markSolved();

    await expect(attempt).resolves.toBe(true);
    expect(deps.closeDocument).toHaveBeenCalled();
  });

  it('resolves false and closes the document when the offscreen page fails', async () => {
    const { deps, solver } = setup();
    const attempt = solver.attempt();
    await flush();

    solver.markFailed();

    await expect(attempt).resolves.toBe(false);
    expect(deps.closeDocument).toHaveBeenCalled();
  });

  it('times out and closes the document', async () => {
    vi.useFakeTimers();
    try {
      const { deps, solver } = setup();
      const attempt = solver.attempt();
      await vi.advanceTimersByTimeAsync(1001);

      await expect(attempt).resolves.toBe(false);
      expect(deps.closeDocument).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does nothing when the offscreen API is unavailable', async () => {
    const { deps, solver } = setup({ isAvailable: () => false });

    await expect(solver.attempt()).resolves.toBe(false);
    expect(deps.createDocument).not.toHaveBeenCalled();
  });

  it('replaces a stale document before creating a new one', async () => {
    const events: string[] = [];
    const { solver } = setup({
      hasDocument: async () => true,
      closeDocument: async () => {
        events.push('close');
      },
      createDocument: async () => {
        events.push('create');
      },
    });
    const attempt = solver.attempt();
    await flush();
    solver.markSolved();
    await attempt;

    expect(events[0]).toBe('close');
    expect(events[1]).toBe('create');
  });

  it('falls back when creating the document fails', async () => {
    const { solver } = setup({
      createDocument: async () => {
        throw new Error('offscreen unavailable');
      },
    });

    await expect(solver.attempt()).resolves.toBe(false);
  });

  it('shares one attempt between callers', async () => {
    const { deps, solver } = setup();
    const first = solver.attempt();
    const second = solver.attempt();
    await flush();
    solver.markSolved();

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(deps.createDocument).toHaveBeenCalledTimes(1);
  });
});
