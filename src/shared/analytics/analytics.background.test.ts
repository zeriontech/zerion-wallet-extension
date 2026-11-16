import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import type { Account } from 'src/background/account/Account';
import { emitter, UI_ANALYTICS_EVENTS } from 'src/background/events';
import type { LabelAddressCopiedParams } from 'src/shared/types/label-events';
import { initialize } from './analytics.background';
import { mixpanelIdentify, mixpanelTrack } from './mixpanel';

type Preferences = { analyticsEnabled: boolean };

const preferences = vi.hoisted(() => {
  type Listener = (state: Preferences, prevState: Preferences) => void;
  const listeners: Listener[] = [];
  return {
    state: { analyticsEnabled: true } as Preferences,
    listeners,
    globalPreferences: {
      getPreferences: async () => preferences.state,
      on: (event: string, listener: Listener) => {
        if (event === 'change') {
          listeners.push(listener);
        }
      },
    },
  };
});

vi.mock('src/background/constants', () => import('src/background/constants.mock'));
vi.mock('src/background/Wallet/Wallet', () => import('src/background/constants.mock'));
vi.mock('src/background/account/Account', () => ({ LoginActivity: {} }));
vi.mock('src/modules/dna-service/dna.background', () => ({ dnaServiceEmitter: { on: vi.fn() } }));
vi.mock('src/background/user-activity', () => ({}));
vi.mock('../core/runtime-store', () => ({}));
vi.mock('./analytics', () => ({
  createParams: <T>(params: T) => params,
  sendToMetabase: vi.fn(),
}));
vi.mock('./google-analytics', () => ({}));
vi.mock('./analyticsId', () => ({}));
vi.mock('./shared/getUserProperties', () => ({}));
vi.mock('./mixpanel', () => ({ mixpanelIdentify: vi.fn(), mixpanelTrack: vi.fn() }));
vi.mock('src/background/Wallet/GlobalPreferences', () => ({
  globalPreferences: preferences.globalPreferences,
  getWalletNameFlagsChange: vi.fn(),
}));

function createAccount() {
  const listeners = new Map<string, Array<() => void>>();
  return {
    getUser: () => ({ id: 'user' }),
    getCurrentWallet: () => ({ readCurrentAddress: () => null }),
    on: (event: string, listener: () => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    },
    emit: (event: string) => listeners.get(event)?.forEach((listener) => listener()),
  };
}

function changePreferences(state: Preferences) {
  const prevState = preferences.state;
  preferences.state = state;
  preferences.listeners.forEach((listener) => listener(state, prevState));
}

async function flush() {
  // handleUserId awaits getPreferences, then calls mixpanelIdentify; two
  // microtask turns settle it without depending on wall-clock time.
  await Promise.resolve();
  await Promise.resolve();
}

describe('analytics initialize', () => {
  beforeEach(() => {
    vi.mocked(mixpanelIdentify).mockClear();
    preferences.listeners.length = 0;
    preferences.state = { analyticsEnabled: true };
  });

  test('identifies on a real unlock and on opt-in, never at worker start', async () => {
    const account = createAccount();

    initialize({ account: account as unknown as Account });
    await flush();
    expect(mixpanelIdentify).toHaveBeenCalledTimes(0);

    account.emit('authenticated');
    await flush();
    expect(mixpanelIdentify).toHaveBeenCalledTimes(1);

    changePreferences({ analyticsEnabled: false });
    changePreferences({ analyticsEnabled: true });
    await flush();
    expect(mixpanelIdentify).toHaveBeenCalledTimes(2);
  });
});

describe('labelAddressCopied', () => {
  const payload: LabelAddressCopiedParams = {
    address: '0xabcdef0000000000000000000000000000000001',
    chain: 'ethereum',
    label_title: 'application',
    act_type: 'trade',
    screen: 'signing_preview',
    platform: 'extension',
  };

  beforeEach(() => {
    vi.mocked(mixpanelTrack).mockClear();
    preferences.state = { analyticsEnabled: true };
    emitter.events = {};
  });

  test('is a UI analytics event', () => {
    expect(UI_ANALYTICS_EVENTS).toContain('labelAddressCopied');
  });

  test('tracks "Label Address Copied" once with analytics on, never with it off', async () => {
    initialize({ account: createAccount() as unknown as Account });

    emitter.emit('labelAddressCopied', payload);
    await flush();
    expect(mixpanelTrack).toHaveBeenCalledTimes(1);
    expect(mixpanelTrack).toHaveBeenCalledWith(
      'Label Address Copied',
      expect.objectContaining(payload),
    );

    vi.mocked(mixpanelTrack).mockClear();
    preferences.state = { analyticsEnabled: false };
    emitter.emit('labelAddressCopied', payload);
    await flush();
    expect(mixpanelTrack).toHaveBeenCalledTimes(0);
  });
});
