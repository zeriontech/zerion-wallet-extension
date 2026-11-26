import type { ChallengeSurface, CloudflareChallengeState } from 'src/shared/cloudflareChallenge';
import { isSecurityCheckUrl } from 'src/shared/cloudflareChallenge';

export interface ChallengeContextInfo {
  contextType: 'TAB' | 'POPUP' | 'SIDE_PANEL' | 'BACKGROUND' | 'OFFSCREEN_DOCUMENT';
  documentUrl?: string;
  tabId?: number;
}

export interface ChallengeCoordinatorDeps {
  getContexts(): Promise<ChallengeContextInfo[]>;
  /** Tells an already-open extension UI to show the Turnstile bottom sheet. */
  notifySheet(): Promise<void>;
  getStoredTabId(): Promise<number | null>;
  setStoredTabId(tabId: number | null): Promise<void>;
  getTab(tabId: number): Promise<{ url?: string } | null>;
  /** Opens the Security check page next to the active tab of a focused normal window. */
  createCheckTab(): Promise<number | null>;
  focusTab(tabId: number): Promise<void>;
  closeTab(tabId: number): Promise<void>;
  getFocusedNormalWindow(): Promise<{ focused?: boolean } | null>;
  setBadge(): Promise<void>;
  clearBadge(): Promise<void>;
  getDismissedAt(): Promise<number | null>;
  setDismissedAt(timestamp: number | null): Promise<void>;
  getPending(): Promise<boolean>;
  setPending(pending: boolean): Promise<void>;
  refreshClearance(): Promise<{ hasClearance: boolean }>;
  trackIssued(surface: ChallengeSurface): void;
  trackSolved(surface: ChallengeSurface): void;
  trackDismissed(surface: ChallengeSurface): void;
  logChallenge(entry: { timestamp: number; endpoint: string }): void;
  onError?(error: unknown): void;
  now?(): number;
}

export interface ChallengeCoordinatorOptions {
  criticalTimeoutMs?: number;
  nonCriticalTimeoutMs?: number;
  cooldownMs?: number;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const DEFAULT_CRITICAL_TIMEOUT_MS = 60 * 1000;
/** Upper bound for queued non-critical calls, so a forgotten UI cannot hang forever. */
const DEFAULT_NON_CRITICAL_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_COOLDOWN_MS = 30 * 60 * 1000;

/** Calls that must not wait indefinitely while the user is elsewhere. */
const CRITICAL_PATH_PREFIXES = ['/security/check-url/', '/transaction/collect/'];

export function isCriticalEndpoint(url: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  return CRITICAL_PATH_PREFIXES.some((prefix) => pathname.includes(prefix));
}

function isDappRequestContext(context: ChallengeContextInfo): boolean {
  if (!context.documentUrl) return false;
  try {
    return new URL(context.documentUrl).searchParams.has('windowId');
  } catch {
    return false;
  }
}

function isExtensionUiContext(context: ChallengeContextInfo): boolean {
  if (isSecurityCheckUrl(context.documentUrl)) return false;
  return (
    context.contextType === 'POPUP' ||
    context.contextType === 'SIDE_PANEL' ||
    context.contextType === 'TAB'
  );
}

interface ActiveChallenge {
  createdAt: number;
  dismissedAt: number | null;
  issuedSurface: ChallengeSurface | null;
  presentedSurface: ChallengeSurface | null;
  presenting: Promise<void> | null;
  waiters: Set<(solved: boolean) => void>;
}

/**
 * Owns the one background challenge resolution at a time and the policy for
 * which surface shows it.
 *
 * A challenge is resolved by a clearance cookie appearing. Calls that hit the
 * challenge await `waitForSolve`; non-critical ones stay queued, critical ones
 * time out and return the original challenge response to the caller's existing
 * error path.
 */
export class ChallengeCoordinator {
  private active: ActiveChallenge | null = null;
  private awaitingFocus = false;
  private trackedPersistedPending = false;
  private readonly criticalTimeoutMs: number;
  private readonly nonCriticalTimeoutMs: number;
  private readonly cooldownMs: number;

  constructor(
    private readonly deps: ChallengeCoordinatorDeps,
    options: ChallengeCoordinatorOptions = {},
  ) {
    this.criticalTimeoutMs = options.criticalTimeoutMs ?? DEFAULT_CRITICAL_TIMEOUT_MS;
    this.nonCriticalTimeoutMs = options.nonCriticalTimeoutMs ?? DEFAULT_NON_CRITICAL_TIMEOUT_MS;
    this.cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  }

  private now() {
    return this.deps.now?.() ?? Date.now();
  }

  private reportError(error: unknown) {
    if (this.deps.onError) {
      this.deps.onError(error);
    } else {
      console.warn('Cloudflare challenge handling failed', error); // eslint-disable-line no-console
    }
  }

  async isCriticalRequest(url: string): Promise<boolean> {
    if (isCriticalEndpoint(url)) {
      return true;
    }
    const contexts = await this.deps.getContexts().catch(() => []);
    return contexts.some(isDappRequestContext);
  }

  async handleChallenge({ endpoint }: { endpoint: string }): Promise<void> {
    this.deps.logChallenge({ timestamp: this.now(), endpoint });
    if (!this.active) {
      this.active = {
        createdAt: this.now(),
        dismissedAt: null,
        issuedSurface: null,
        presentedSurface: null,
        presenting: null,
        waiters: new Set(),
      };
      await this.deps.setPending(true);
    }
    await this.present();
  }

  /** Waits for the clearance. Returns false when the waiter should return the challenge response. */
  waitForSolve(critical: boolean): Promise<boolean> {
    const active = this.active;
    if (!active) {
      // Solved before this call got here.
      return Promise.resolve(true);
    }
    const timeoutMs = critical ? this.criticalTimeoutMs : this.nonCriticalTimeoutMs;
    const { promise, resolve } = createDeferred<boolean>();
    const timeoutState: { timer?: ReturnType<typeof setTimeout> } = {};
    let settled = false;
    const finish = (solved: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutState.timer);
      active.waiters.delete(finish);
      resolve(solved);
    };
    timeoutState.timer = setTimeout(() => finish(false), timeoutMs);
    active.waiters.add(finish);
    return promise;
  }

  private markIssued(active: ActiveChallenge, surface: ChallengeSurface) {
    active.presentedSurface = surface;
    if (active.issuedSurface == null) {
      active.issuedSurface = surface;
      this.deps.trackIssued(surface);
    }
  }

  private async present(): Promise<void> {
    const active = this.active;
    if (!active) return;
    // Already shown and not dismissed: do not reopen on every challenged call.
    if (active.issuedSurface != null && active.dismissedAt == null) return;
    if (active.presenting) return active.presenting;
    active.presenting = this.doPresent(active)
      .catch((error) => this.reportError(error))
      .finally(() => {
        if (this.active === active) {
          active.presenting = null;
        }
      });
    return active.presenting;
  }

  private async doPresent(active: ActiveChallenge): Promise<void> {
    const contexts = await this.deps.getContexts().catch(() => []);

    // One page at a time: focus the existing one instead of creating another.
    const pageContext = contexts.find(
      (context) => context.contextType === 'TAB' && isSecurityCheckUrl(context.documentUrl),
    );
    if (pageContext?.tabId != null) {
      await this.deps.setStoredTabId(pageContext.tabId);
      await this.deps.focusTab(pageContext.tabId);
      this.markIssued(active, 'page');
      return;
    }

    const storedTabId = await this.deps.getStoredTabId();
    if (storedTabId != null) {
      const tab = await this.deps.getTab(storedTabId);
      if (tab && isSecurityCheckUrl(tab.url)) {
        await this.deps.focusTab(storedTabId);
        this.markIssued(active, 'page');
        return;
      }
      if (!tab) {
        // A challenge can wake the worker before the tab removal event arrives.
        await this.onTabRemoved(storedTabId);
      } else {
        await this.deps.setStoredTabId(null);
      }
    }

    // An open extension UI gets the sheet even during the page cooldown: the
    // cooldown only forbids opening a new tab.
    const hasUiOpen = contexts.some(isExtensionUiContext);
    if (hasUiOpen) {
      await this.deps.notifySheet();
      this.markIssued(active, 'sheet');
      return;
    }

    const dismissedAt = active.dismissedAt ?? (await this.deps.getDismissedAt());
    if (dismissedAt != null && this.now() < dismissedAt + this.cooldownMs) {
      await this.deps.setBadge();
      return;
    }

    const focusedWindow = await this.deps.getFocusedNormalWindow().catch(() => null);
    if (!focusedWindow?.focused) {
      this.awaitingFocus = true;
      return;
    }

    const tabId = await this.deps.createCheckTab();
    if (tabId == null) return;
    this.awaitingFocus = false;
    active.dismissedAt = null;
    await this.deps.setDismissedAt(null);
    await this.deps.setStoredTabId(tabId);
    this.markIssued(active, 'page');
  }

  async onWindowFocusChanged(windowId: number): Promise<void> {
    if (windowId === -1) return; // WINDOW_ID_NONE
    if (!this.awaitingFocus) return;
    this.awaitingFocus = false;
    await this.present();
  }

  async onTabRemoved(tabId: number): Promise<void> {
    const storedTabId = await this.deps.getStoredTabId();
    if (storedTabId !== tabId) return;
    // A tracked page can be closed while the worker is stopped. Record the
    // dismissal before discarding the tab ID so a concurrent challenge sees it.
    await this.markDismissed('page');
    await this.deps.setStoredTabId(null);
  }

  async markSolved(surface: ChallengeSurface): Promise<void> {
    const active = this.active;
    this.active = null;
    this.awaitingFocus = false;
    this.trackedPersistedPending = false;
    try {
      // Must happen before waking the waiters: their retry has to hit the new rule.
      await this.deps.refreshClearance();
    } catch (error) {
      this.reportError(error);
    }
    await this.deps.setPending(false);
    await this.deps.setDismissedAt(null);
    await this.deps.clearBadge();
    if (active) {
      for (const waiter of active.waiters) {
        waiter(true);
      }
      active.waiters.clear();
      this.deps.trackSolved(surface);
    }
    const tabId = await this.deps.getStoredTabId();
    if (tabId != null) {
      await this.deps.setStoredTabId(null);
      // The page closes itself after its success state. Closing it from here
      // would skip the 1.5 s confirmation the user is supposed to see.
      const pageClosesItself = surface === 'page' && active?.presentedSurface === 'page';
      if (!pageClosesItself) {
        await this.deps.closeTab(tabId).catch((error) => this.reportError(error));
      }
    }
  }

  async markDismissed(surface: ChallengeSurface): Promise<void> {
    if (!this.active && !(await this.deps.getPending())) return;
    const active = this.active;
    if (active?.dismissedAt != null) return;
    const now = this.now();
    if (active) active.dismissedAt = now;
    await this.deps.setDismissedAt(now);
    await this.deps.setBadge();
    this.deps.trackDismissed(surface);
  }

  async getState(): Promise<CloudflareChallengeState> {
    const pending = Boolean(this.active) || (await this.deps.getPending());
    if (this.active && this.active.issuedSurface == null) {
      // The popup is about to show the sheet, so this is the first surface.
      this.markIssued(this.active, 'sheet');
    } else if (!this.active && pending && !this.trackedPersistedPending) {
      // The worker restarted after the page was dismissed; the popup is the
      // first surface the user sees for this challenge.
      this.trackedPersistedPending = true;
      this.deps.trackIssued('sheet');
    }
    const dismissedAt = this.active?.dismissedAt ?? (await this.deps.getDismissedAt());
    return {
      pending,
      dismissed: dismissedAt != null,
      surface: this.active?.presentedSurface ?? null,
    };
  }
}
