import { describe, expect, it, vi } from 'vite-plus/test';
import type {
  ChallengeContextInfo,
  ChallengeCoordinatorDeps,
  ChallengeCoordinatorOptions,
} from './ChallengeCoordinator';
import { ChallengeCoordinator, isCriticalEndpoint } from './ChallengeCoordinator';

const SECURITY_CHECK_URL =
  'chrome-extension://extension-id/ui/popup.html?windowType=tab#/security-check';
const POPUP_URL = 'chrome-extension://extension-id/ui/popup.html';

interface SetupOptions {
  contexts?: ChallengeContextInfo[];
  focused?: boolean;
  createTabId?: number | null;
  storedTabId?: number | null;
  storedTabUrl?: string;
  pending?: boolean;
  dismissedAt?: number | null;
  now?: number;
  offscreenSolve?: false | (() => Promise<boolean>);
}

function setup(initial: SetupOptions = {}) {
  let storedTabId = initial.storedTabId ?? null;
  let dismissedAt = initial.dismissedAt ?? null;
  let pending = initial.pending ?? false;
  let now = initial.now ?? 0;
  const focused = initial.focused ?? true;
  const contexts = initial.contexts ?? [];
  const offscreenSolve = initial.offscreenSolve ?? false;
  const createTabId = initial.createTabId === undefined ? 42 : initial.createTabId;
  const order: string[] = [];

  const deps: ChallengeCoordinatorDeps = {
    getContexts: vi.fn(async () => contexts),
    notifySheet: vi.fn(async () => {
      order.push('notify-sheet');
    }),
    getStoredTabId: vi.fn(async () => storedTabId),
    setStoredTabId: vi.fn(async (tabId) => {
      storedTabId = tabId;
    }),
    getTab: vi.fn(async () => ({
      url: initial.storedTabUrl ?? SECURITY_CHECK_URL,
    })),
    createCheckTab: vi.fn(async () => {
      order.push('create-tab');
      return createTabId;
    }),
    focusTab: vi.fn(async () => {
      order.push('focus-tab');
    }),
    closeTab: vi.fn(async () => {
      order.push('close-tab');
    }),
    getFocusedNormalWindow: vi.fn(async () => ({ focused })),
    setBadge: vi.fn(async () => {
      order.push('set-badge');
    }),
    clearBadge: vi.fn(async () => {
      order.push('clear-badge');
    }),
    getDismissedAt: vi.fn(async () => dismissedAt),
    setDismissedAt: vi.fn(async (timestamp) => {
      dismissedAt = timestamp;
    }),
    getPending: vi.fn(async () => pending),
    setPending: vi.fn(async (value) => {
      pending = value;
    }),
    refreshClearance: vi.fn(async () => {
      order.push('refresh-clearance');
      return { hasClearance: true };
    }),
    attemptOffscreenSolve:
      typeof offscreenSolve === 'function'
        ? vi.fn(offscreenSolve)
        : vi.fn(async () => offscreenSolve),
    trackIssued: vi.fn(),
    trackSolved: vi.fn(),
    trackDismissed: vi.fn(),
    logChallenge: vi.fn(),
    now: () => now,
  };

  return {
    deps,
    order,
    setTime: (value: number) => {
      now = value;
    },
    get storedTabId() {
      return storedTabId;
    },
    get dismissedAt() {
      return dismissedAt;
    },
    get pending() {
      return pending;
    },
  };
}

function coordinator(deps: ChallengeCoordinatorDeps, options: ChallengeCoordinatorOptions = {}) {
  return new ChallengeCoordinator(deps, options);
}

describe('isCriticalEndpoint', () => {
  it('classifies security checks and transaction collection as critical', () => {
    expect(isCriticalEndpoint('https://zpi.zerion.io/security/check-url/v1?url=x')).toBe(true);
    expect(isCriticalEndpoint('https://zpi.zerion.io/transaction/collect/v1')).toBe(true);
    expect(isCriticalEndpoint('https://zpi.zerion.io/wallet/get-portfolio/v1')).toBe(false);
  });

  it('treats calls made while a dApp request window is open as critical', async () => {
    const { deps } = setup({
      contexts: [
        {
          contextType: 'POPUP',
          documentUrl: `${POPUP_URL}?windowType=dialog&windowId=abc`,
        },
      ],
    });
    expect(await coordinator(deps).isCriticalRequest('https://zpi.zerion.io/wallet/x')).toBe(true);
  });
});

describe('ChallengeCoordinator surfaces', () => {
  it('keeps one resolution in flight for concurrent challenged calls', async () => {
    const { deps } = setup();
    const instance = coordinator(deps);

    await Promise.all([
      instance.handleChallenge({ endpoint: '/a' }),
      instance.handleChallenge({ endpoint: '/b' }),
    ]);

    expect(deps.createCheckTab).toHaveBeenCalledTimes(1);
    expect(deps.setPending).toHaveBeenCalledTimes(1);
    expect(deps.trackIssued).toHaveBeenCalledTimes(1);
    expect(deps.trackIssued).toHaveBeenCalledWith('page');
    expect(deps.logChallenge).toHaveBeenCalledTimes(2);
  });

  it('shows the existing sheet when any extension UI is open', async () => {
    const { deps } = setup({ contexts: [{ contextType: 'POPUP', documentUrl: POPUP_URL }] });
    await coordinator(deps).handleChallenge({ endpoint: '/wallet' });

    expect(deps.notifySheet).toHaveBeenCalledTimes(1);
    expect(deps.createCheckTab).not.toHaveBeenCalled();
    expect(deps.trackIssued).toHaveBeenCalledWith('sheet');
  });

  it('opens the page once and focuses it on later challenges', async () => {
    const { deps } = setup();
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/first' });
    await instance.handleChallenge({ endpoint: '/second' });

    expect(deps.createCheckTab).toHaveBeenCalledTimes(1);
    expect(deps.setStoredTabId).toHaveBeenCalledWith(42);
    expect(deps.focusTab).not.toHaveBeenCalled();
  });

  it('focuses an already-open page instead of opening another', async () => {
    const { deps } = setup({
      contexts: [{ contextType: 'TAB', documentUrl: SECURITY_CHECK_URL, tabId: 7 }],
    });
    await coordinator(deps).handleChallenge({ endpoint: '/wallet' });

    expect(deps.focusTab).toHaveBeenCalledWith(7);
    expect(deps.createCheckTab).not.toHaveBeenCalled();
    expect(deps.trackIssued).toHaveBeenCalledWith('page');
  });

  it('focuses the stored page after a service-worker restart', async () => {
    const { deps } = setup({ storedTabId: 9, storedTabUrl: SECURITY_CHECK_URL });
    await coordinator(deps).handleChallenge({ endpoint: '/wallet' });

    expect(deps.focusTab).toHaveBeenCalledWith(9);
    expect(deps.createCheckTab).not.toHaveBeenCalled();
  });

  it('waits for Chrome to be focused before opening the page', async () => {
    const { deps } = setup({ focused: false });
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/wallet' });
    expect(deps.createCheckTab).not.toHaveBeenCalled();

    await instance.onWindowFocusChanged(-1);
    expect(deps.createCheckTab).not.toHaveBeenCalled();

    vi.mocked(deps.getFocusedNormalWindow).mockResolvedValue({ focused: true });
    await instance.onWindowFocusChanged(5);
    expect(deps.createCheckTab).toHaveBeenCalledTimes(1);
  });

  it('keeps the 30-minute cooldown across a service-worker restart after dismissal', async () => {
    const { deps, setTime } = setup({ createTabId: 7, now: 1000 });
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/first' });
    await instance.onTabRemoved(7);

    expect(deps.trackDismissed).toHaveBeenCalledWith('page');
    expect(deps.setBadge).toHaveBeenCalled();
    expect(await instance.getState()).toEqual({
      pending: true,
      dismissed: true,
      surface: 'page',
      silent: false,
    });

    const restarted = coordinator(deps);
    setTime(1000 + 30 * 60 * 1000 - 1);
    await restarted.handleChallenge({ endpoint: '/during-cooldown' });
    expect(deps.createCheckTab).toHaveBeenCalledTimes(1);

    setTime(1000 + 30 * 60 * 1000);
    await restarted.handleChallenge({ endpoint: '/after-cooldown' });
    expect(deps.createCheckTab).toHaveBeenCalledTimes(2);
  });

  it('starts the cooldown when closing the page wakes a stopped service worker', async () => {
    const { deps, setTime } = setup({ createTabId: 7 });
    await coordinator(deps).handleChallenge({ endpoint: '/first' });

    const restarted = coordinator(deps);
    setTime(1000);
    await restarted.onTabRemoved(7);

    expect(deps.setBadge).toHaveBeenCalled();
    expect(deps.trackDismissed).toHaveBeenCalledWith('page');
    await restarted.handleChallenge({ endpoint: '/after-close' });
    expect(deps.createCheckTab).toHaveBeenCalledTimes(1);
  });

  it('does not reopen a closed page if a challenge arrives before the tab removal event', async () => {
    const { deps } = setup({ storedTabId: 7, pending: true });
    vi.mocked(deps.getTab).mockResolvedValue(null);

    await coordinator(deps).handleChallenge({ endpoint: '/first-after-close' });

    expect(deps.setBadge).toHaveBeenCalled();
    expect(deps.createCheckTab).not.toHaveBeenCalled();
  });

  it('shows the sheet when the popup asks about a challenge persisted by a restarted worker', async () => {
    const { deps } = setup({ pending: true });
    expect(await coordinator(deps).getState()).toEqual({
      pending: true,
      dismissed: false,
      surface: null,
      silent: false,
    });
    expect(deps.trackIssued).toHaveBeenCalledWith('sheet');
  });
});

describe('ChallengeCoordinator resolution', () => {
  it('solves silently in the offscreen document without showing any UI', async () => {
    const { deps } = setup({ offscreenSolve: async () => true });
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/wallet' });

    expect(deps.attemptOffscreenSolve).toHaveBeenCalledTimes(1);
    expect(deps.notifySheet).not.toHaveBeenCalled();
    expect(deps.createCheckTab).not.toHaveBeenCalled();
    expect(deps.refreshClearance).toHaveBeenCalled();
    expect(deps.trackIssued).not.toHaveBeenCalled();
    expect(deps.trackSolved).toHaveBeenCalledWith('offscreen');
    expect(await instance.waitForSolve(false)).toBe(true);
  });

  it('falls back to the visible surface when the offscreen attempt fails', async () => {
    const { deps } = setup({ offscreenSolve: async () => false });
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/wallet' });

    expect(deps.attemptOffscreenSolve).toHaveBeenCalledTimes(1);
    expect(deps.createCheckTab).toHaveBeenCalledTimes(1);
    expect(deps.trackIssued).toHaveBeenCalledWith('page');
  });

  it('reports a silent attempt in state so the UI does not open the sheet yet', async () => {
    let finishOffscreen!: (solved: boolean) => void;
    const { deps } = setup({
      offscreenSolve: () =>
        new Promise<boolean>((resolve) => {
          finishOffscreen = resolve;
        }),
    });
    const instance = coordinator(deps);
    const handling = instance.handleChallenge({ endpoint: '/wallet' });
    await Promise.resolve();

    expect(await instance.getState()).toMatchObject({ pending: true, silent: true });
    finishOffscreen(false);
    await handling;
    expect(await instance.getState()).toMatchObject({ pending: true, silent: false });
  });

  it('stops the fallback when a visible surface solves during the silent attempt', async () => {
    let finishOffscreen!: (solved: boolean) => void;
    const { deps } = setup({
      offscreenSolve: () =>
        new Promise<boolean>((resolve) => {
          finishOffscreen = resolve;
        }),
    });
    const instance = coordinator(deps);
    const handling = instance.handleChallenge({ endpoint: '/wallet' });
    await Promise.resolve();
    await instance.markSolved('sheet');
    finishOffscreen(false);
    await handling;

    expect(deps.createCheckTab).not.toHaveBeenCalled();
    expect(deps.notifySheet).not.toHaveBeenCalled();
  });

  it('wakes every waiter after a solve', async () => {
    const { deps, order } = setup({ createTabId: 11 });
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/wallet' });
    const waiters = [instance.waitForSolve(false), instance.waitForSolve(false)];
    await Promise.resolve();
    await instance.markSolved('page');

    expect(await Promise.all(waiters)).toEqual([true, true]);
    expect(order.indexOf('refresh-clearance')).toBeLessThan(order.indexOf('clear-badge'));
    expect(deps.clearBadge).toHaveBeenCalled();
    // The page shows its success state and closes itself.
    expect(deps.closeTab).not.toHaveBeenCalled();
    expect(deps.trackSolved).toHaveBeenCalledWith('page');
    expect((await instance.getState()).pending).toBe(false);
  });

  it('closes the page when the sheet solves the challenge', async () => {
    const { deps } = setup({ createTabId: 12 });
    const instance = coordinator(deps);
    await instance.handleChallenge({ endpoint: '/wallet' });
    await instance.markSolved('sheet');

    expect(deps.closeTab).toHaveBeenCalledWith(12);
  });

  it('keeps non-critical waiters queued when the page is dismissed', async () => {
    const { deps } = setup({ createTabId: 3 });
    const instance = coordinator(deps);

    await instance.handleChallenge({ endpoint: '/wallet' });
    let resolved = false;
    const waiter = instance.waitForSolve(false).then((value) => {
      resolved = true;
      return value;
    });
    await instance.onTabRemoved(3);
    await Promise.resolve();

    expect(resolved).toBe(false);
    await instance.markSolved('sheet');
    expect(await waiter).toBe(true);
  });

  it('times out critical calls and returns the challenge response', async () => {
    vi.useFakeTimers();
    try {
      const { deps } = setup();
      const instance = coordinator(deps, { criticalTimeoutMs: 1000 });
      await instance.handleChallenge({ endpoint: '/security/check-url' });

      const critical = instance.waitForSolve(true);
      await vi.advanceTimersByTimeAsync(1001);
      await expect(critical).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps non-critical calls waiting longer than critical ones', async () => {
    vi.useFakeTimers();
    try {
      const { deps } = setup();
      const instance = coordinator(deps, {
        criticalTimeoutMs: 1000,
        nonCriticalTimeoutMs: 10_000,
      });
      await instance.handleChallenge({ endpoint: '/wallet' });

      const nonCritical = instance.waitForSolve(false);
      await vi.advanceTimersByTimeAsync(1001);
      let resolved = false;
      void nonCritical.then(() => {
        resolved = true;
      });
      await Promise.resolve();
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(9000);
      await expect(nonCritical).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
