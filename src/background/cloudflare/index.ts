import {
  FEATURE_BACKGROUND_CLOUDFLARE_CHALLENGE,
  PLATFORM,
  ZERION_API_URL,
  ZERION_TESTNET_API_URL,
} from 'src/env/config';
import { getPopupUrl } from 'src/shared/getPopupUrl';
import { setUrlContext } from 'src/shared/setUrlContext';
import {
  CLOUDFLARE_CHALLENGE_MESSAGE,
  SECURITY_CHECK_ROUTE,
  isCloudflareChallengeMessage,
} from 'src/shared/cloudflareChallenge';
import { emitter } from 'src/background/events';
import type { CookieLike } from './cookies';
import { domainCoversHost } from './cookies';
import { ClearanceCookieMirror } from './ClearanceCookieMirror';
import type { ChallengeContextInfo } from './ChallengeCoordinator';
import { ChallengeCoordinator } from './ChallengeCoordinator';
import { getBackgroundChallengeCoordinator, setBackgroundChallengeCoordinator } from './registry';

const STORAGE_KEYS = {
  tabId: 'cloudflareSecurityCheckTabId',
  dismissedAt: 'cloudflareChallengeDismissedAt',
  pending: 'cloudflareChallengePending',
  log: 'cloudflareChallengeLog',
} as const;

const MAX_LOG_ENTRIES = 500;

type StoredChallenge = { timestamp: number; endpoint: string };

function apiHosts(): string[] {
  const hosts = [new URL(ZERION_API_URL).hostname, new URL(ZERION_TESTNET_API_URL).hostname];
  return [...new Set(hosts)];
}

function isRelevantCookie(domain: string, hosts: readonly string[]): boolean {
  return hosts.some((host) => domainCoversHost(host, domain));
}

type CookieQuery = chrome.cookies.GetAllDetails & { partitionKey?: Record<string, never> };
type CookieWithCreation = chrome.cookies.Cookie & { creationDate?: number };

async function listCookiesForHost(host: string): Promise<CookieLike[]> {
  const query: CookieQuery = { url: `https://${host}/`, partitionKey: {} };
  const cookies = (await chrome.cookies.getAll(query)) as CookieWithCreation[];
  return cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expirationDate: cookie.expirationDate,
    creationDate: cookie.creationDate,
    session: cookie.session,
  }));
}

async function readSessionValue<T>(key: string): Promise<T | undefined> {
  const values = await chrome.storage.session.get(key);
  return values[key] as T | undefined;
}

async function writeSessionValue(key: string, value: unknown): Promise<void> {
  await chrome.storage.session.set({ [key]: value });
}

async function appendChallengeLog(entry: StoredChallenge): Promise<void> {
  const existing = (await chrome.storage.local.get(STORAGE_KEYS.log))[STORAGE_KEYS.log];
  const entries: StoredChallenge[] = Array.isArray(existing) ? existing : [];
  entries.push(entry);
  if (entries.length > MAX_LOG_ENTRIES) {
    entries.splice(0, entries.length - MAX_LOG_ENTRIES);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.log]: entries });
}

function logChallenge(entry: StoredChallenge) {
  // No cookie values, ever: endpoint path and timestamp only.
  // eslint-disable-next-line no-console
  console.warn(
    `[cloudflare-challenge] ${new Date(entry.timestamp).toISOString()} ${entry.endpoint}`,
  );
  void appendChallengeLog(entry).catch(() => {
    /* Logging must never break the retry path. */
  });
}

function setBadge() {
  void chrome.action.setBadgeBackgroundColor({ color: '#F5A623' });
  return chrome.action.setBadgeText({ text: '!' });
}

function clearBadge() {
  return chrome.action.setBadgeText({ text: '' });
}

function createSecurityCheckUrl(): string {
  const url = getPopupUrl();
  setUrlContext(url.searchParams, { windowType: 'tab', windowLayout: 'page' });
  url.hash = SECURITY_CHECK_ROUTE;
  return url.toString();
}

async function createCheckTab(): Promise<number | null> {
  const window = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
  if (window.id == null) return null;
  const [activeTab] = await chrome.tabs.query({ active: true, windowId: window.id });
  const tab = await chrome.tabs.create({
    url: createSecurityCheckUrl(),
    windowId: window.id,
    index: activeTab?.index == null ? undefined : activeTab.index + 1,
    active: true,
  });
  return tab.id ?? null;
}

async function focusTab(tabId: number): Promise<void> {
  const tab = await chrome.tabs.update(tabId, { active: true });
  if (tab?.windowId != null) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}

function isExtensionPageSender(sender: chrome.runtime.MessageSender): boolean {
  return (
    sender.id === chrome.runtime.id && Boolean(sender.url?.startsWith(chrome.runtime.getURL('')))
  );
}

export function initializeCloudflareChallengeHandling(): void {
  if (FEATURE_BACKGROUND_CLOUDFLARE_CHALLENGE !== 'on' || PLATFORM !== 'chrome') {
    return;
  }
  if (getBackgroundChallengeCoordinator()) return;

  const hosts = apiHosts();
  const mirror = new ClearanceCookieMirror({
    hosts,
    extensionId: chrome.runtime.id,
    listCookies: listCookiesForHost,
    updateSessionRules: (options) => chrome.declarativeNetRequest.updateSessionRules(options),
  });

  const coordinator = new ChallengeCoordinator({
    getContexts: async () => {
      const contexts = await chrome.runtime.getContexts({});
      return contexts.map((context): ChallengeContextInfo => ({
        contextType: context.contextType,
        documentUrl: context.documentUrl,
        tabId: context.tabId,
      }));
    },
    notifySheet: async () => {
      await chrome.runtime.sendMessage({
        type: CLOUDFLARE_CHALLENGE_MESSAGE,
        action: 'show-sheet',
      });
    },
    getStoredTabId: async () => (await readSessionValue<number>(STORAGE_KEYS.tabId)) ?? null,
    setStoredTabId: (tabId) => writeSessionValue(STORAGE_KEYS.tabId, tabId),
    getTab: async (tabId) => {
      try {
        return await chrome.tabs.get(tabId);
      } catch {
        return null;
      }
    },
    createCheckTab,
    focusTab,
    closeTab: (tabId) => chrome.tabs.remove(tabId),
    getFocusedNormalWindow: async () => {
      try {
        return await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
      } catch {
        return null;
      }
    },
    setBadge,
    clearBadge,
    getDismissedAt: async () => (await readSessionValue<number>(STORAGE_KEYS.dismissedAt)) ?? null,
    setDismissedAt: (timestamp) => writeSessionValue(STORAGE_KEYS.dismissedAt, timestamp),
    getPending: async () => Boolean(await readSessionValue<boolean>(STORAGE_KEYS.pending)),
    setPending: (pending) => writeSessionValue(STORAGE_KEYS.pending, pending),
    refreshClearance: () => mirror.refresh(),
    trackIssued: (surface) =>
      emitter.emit('cloudflareChallengeIssued', { source: 'background', surface }),
    trackSolved: (surface) => emitter.emit('cloudflareChallengeSolved', { surface }),
    trackDismissed: (surface) => emitter.emit('cloudflareChallengeDismissed', { surface }),
    logChallenge,
    onError: (error) => {
      console.warn('Cloudflare challenge handling failed', error); // eslint-disable-line no-console
    },
  });

  setBackgroundChallengeCoordinator(coordinator);

  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      void mirror.refresh().catch((error) => {
        console.warn('Cloudflare clearance refresh failed', error); // eslint-disable-line no-console
      });
    }, 50);
  };

  chrome.cookies.onChanged.addListener(({ cookie }) => {
    if (isRelevantCookie(cookie.domain, hosts)) {
      scheduleRefresh();
    }
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    void coordinator?.onTabRemoved(tabId);
  });
  chrome.windows.onFocusChanged.addListener((windowId) => {
    void coordinator?.onWindowFocusChanged(windowId);
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isCloudflareChallengeMessage(message)) return false;
    if (message.action === 'show-sheet') return false;
    if (!isExtensionPageSender(sender)) return false;
    const activeCoordinator = coordinator;
    if (!activeCoordinator) return false;

    if (message.action === 'get-state') {
      void activeCoordinator.getState().then(sendResponse);
      return true;
    }
    const result =
      message.action === 'solved'
        ? activeCoordinator.markSolved(message.surface)
        : activeCoordinator.markDismissed(message.surface);
    void result
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  });

  void mirror.refresh().catch((error) => {
    console.warn('Cloudflare clearance refresh failed', error); // eslint-disable-line no-console
  });
  void (async () => {
    const [pending, dismissedAt] = await Promise.all([
      readSessionValue<boolean>(STORAGE_KEYS.pending),
      readSessionValue<number>(STORAGE_KEYS.dismissedAt),
    ]);
    if (pending && dismissedAt != null) {
      await setBadge();
    }
  })();
}
