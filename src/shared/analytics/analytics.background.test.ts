import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import type { Account } from 'src/background/account/Account';
import { emitter, UI_ANALYTICS_EVENTS } from 'src/background/events';
import type { LabelAddressCopiedParams } from 'src/shared/types/label-events';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { initialize } from './analytics.background';
import { mixpanelIdentify, mixpanelSetUserProperties, mixpanelTrack } from './mixpanel';
import { sendToMetabase } from './analytics';
import { perpReferral } from 'src/modules/hyperliquid/api/requests/perp-referral.client';

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
vi.mock('./google-analytics', () => ({
  gaCollect: vi.fn(),
  prepareGaParams: vi.fn(async (params: Record<string, unknown>) => ({ params })),
}));
vi.mock('./analyticsId', () => ({}));
vi.mock('./shared/getUserProperties', () => ({}));
vi.mock('./mixpanel', () => ({
  mixpanelIdentify: vi.fn(),
  mixpanelTrack: vi.fn(),
  mixpanelSetUserProperties: vi.fn(),
}));
vi.mock('src/modules/hyperliquid/api/requests/perp-referral.client', () => ({
  perpReferral: vi.fn(),
}));
vi.mock('src/background/Wallet/GlobalPreferences', () => ({
  globalPreferences: preferences.globalPreferences,
  getWalletNameFlagsChange: vi.fn(),
}));

function createAccount() {
  const listeners = new Map<string, Array<() => void>>();
  return {
    getUser: () => ({ id: 'user' }),
    getCurrentWallet: () => ({
      readCurrentAddress: () => null,
      getPreferences: async () => ({ enableHoldToSignButton: false }),
      getWalletGroupByAddressSync: () => null,
    }),
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

const SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112';
const EVM_ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7';

function createTransactionContext(chain: string) {
  return {
    mode: 'default' as const,
    chain,
    feeValueCommon: null,
    initiator: 'https://app.zerion.io/send',
    clientScope: 'Send' as const,
    addressAction: null,
  };
}

async function flushTransaction() {
  // Reads the wallet preferences, then awaits the (mocked) GA and Mixpanel sinks.
  for (let index = 0; index < 20; index++) {
    await Promise.resolve();
  }
}

function lastMixpanelParams() {
  const calls = vi.mocked(mixpanelTrack).mock.calls;
  return calls.at(-1)?.[1] as Record<string, unknown>;
}

describe('transaction sign analytics', () => {
  beforeEach(() => {
    vi.mocked(mixpanelTrack).mockClear();
    vi.mocked(sendToMetabase).mockClear();
    preferences.state = { analyticsEnabled: true };
    preferences.listeners.length = 0;
    emitter.events = {};
    // `trackTransactionSign` compares the initiator origin with the extension origin.
    Object.defineProperty(globalThis, 'location', {
      value: new URL('https://extension.test'),
      configurable: true,
    });
    initialize({ account: createAccount() as unknown as Account });
  });

  test('reports a failed Solana broadcast with the iOS error fields', async () => {
    const nodeMessage = 'Transaction simulation failed: Blockhash not found';
    emitter.emit(
      'transactionFailed',
      {
        message: nodeMessage,
        code: 'web3.send_failed',
        stage: 'broadcast',
        nodeMessage,
        address: SOLANA_ADDRESS,
      },
      createTransactionContext('solana'),
    );
    await flushTransaction();

    expect(mixpanelTrack).toHaveBeenCalledTimes(1);
    expect(mixpanelTrack).toHaveBeenCalledWith(
      'Transaction: Signed Transaction',
      expect.objectContaining({
        transaction_success: false,
        error_code: 'web3.send_failed',
        error_stage: 'broadcast',
        error_message: nodeMessage,
        ecosystem: 'Solana',
        chain: 'solana',
        transaction_error_message: nodeMessage,
        backend_error_message: nodeMessage,
      }),
    );
    expect(sendToMetabase).toHaveBeenCalledWith(
      'signed_transaction',
      expect.objectContaining({ wallet_address: SOLANA_ADDRESS, ecosystem: 'Solana' }),
    );
  });

  test('redacts addresses in a failed EVM broadcast message', async () => {
    const nodeMessage = `insufficient funds for gas * price + value: address ${EVM_ADDRESS} have 0 want 1`;
    emitter.emit(
      'transactionFailed',
      {
        message: nodeMessage,
        code: 'broadcast.insufficient_funds',
        stage: 'broadcast',
        nodeMessage,
        address: EVM_ADDRESS,
      },
      createTransactionContext('ethereum'),
    );
    await flushTransaction();

    const params = lastMixpanelParams();
    const redacted = 'insufficient funds for gas * price + value: address 0x… have 0 want 1';
    expect(params).toEqual(
      expect.objectContaining({
        transaction_success: false,
        error_code: 'broadcast.insufficient_funds',
        error_stage: 'broadcast',
        error_message: redacted,
        transaction_error_message: redacted,
        backend_error_message: redacted,
        ecosystem: 'EVM',
      }),
    );
  });

  test('reports a signing failure without a node message', async () => {
    emitter.emit(
      'transactionFailed',
      {
        message: 'User rejected the request.',
        code: 'sign.user_rejected',
        stage: 'sign',
        nodeMessage: null,
        address: EVM_ADDRESS,
      },
      createTransactionContext('ethereum'),
    );
    await flushTransaction();

    const params = lastMixpanelParams();
    expect(params.error_stage).toBe('sign');
    expect(params.error_code).toBe('sign.user_rejected');
    // null, so the Mixpanel sink drops the key and Metabase stores no node message
    expect(params.error_message).toBeNull();
  });

  test('a successful transaction carries no failure fields', async () => {
    emitter.emit(
      'transactionSent',
      { solana: { signature: 'signature', publicKey: SOLANA_ADDRESS, tx: 'tx' as StringBase64 } },
      createTransactionContext('solana'),
    );
    await flushTransaction();

    const params = lastMixpanelParams();
    expect(params.transaction_success).toBe(true);
    for (const key of ['error_code', 'error_stage', 'error_message', 'transaction_error_message']) {
      expect(params).not.toHaveProperty(key);
    }
  });

  test('sends nothing for a failure when analytics is off', async () => {
    preferences.state = { analyticsEnabled: false };
    emitter.emit(
      'transactionFailed',
      {
        message: 'boom',
        code: 'broadcast.transport',
        stage: 'broadcast',
        nodeMessage: null,
        address: null,
      },
      createTransactionContext('ethereum'),
    );
    await flushTransaction();

    expect(mixpanelTrack).toHaveBeenCalledTimes(0);
  });
});

describe('hyperliquid signed-message analytics', () => {
  const hyperliquidTypedData = {
    domain: { name: 'HyperliquidSignTransaction', version: '1', chainId: 42161 },
    types: {},
    primaryType: 'HyperliquidTransaction:ApproveBuilderFee',
    message: {
      hyperliquidChain: 'Mainnet',
      maxFeeRate: '0.1%',
      builder: '0x7a1e00000000000000000000000000000000c3f0',
      nonce: 1,
    },
  };

  beforeEach(() => {
    vi.mocked(mixpanelTrack).mockClear();
    vi.mocked(mixpanelSetUserProperties).mockClear();
    vi.mocked(perpReferral).mockReset();
    preferences.state = { analyticsEnabled: true };
    preferences.listeners.length = 0;
    emitter.events = {};
    Object.defineProperty(globalThis, 'location', {
      value: new URL('https://extension.test'),
      configurable: true,
    });
    initialize({ account: createAccount() as unknown as Account });
  });

  test('adds Hyperliquid action properties without the wallet address', async () => {
    vi.mocked(perpReferral).mockResolvedValue({ referredBy: null });
    emitter.emit('typedDataSigned', {
      typedData: hyperliquidTypedData,
      address: EVM_ADDRESS,
      initiator: 'https://app.hyperliquid.xyz',
      clientScope: 'External Dapp',
    });
    await flushTransaction();

    const params = lastMixpanelParams();
    expect(params).toMatchObject({
      typed_data_primary_type: 'HyperliquidTransaction:ApproveBuilderFee',
      hl_builder: '0x7a1e00000000000000000000000000000000c3f0',
      hl_max_fee_rate: '0.1%',
      dapp_domain: 'https://app.hyperliquid.xyz',
    });
    expect(params).not.toHaveProperty('address');
    expect(params).not.toHaveProperty('wallet_address');
  });

  test('stores referredBy as a user property only for the official origin', async () => {
    vi.mocked(perpReferral).mockResolvedValue({
      referredBy: { referrer: '0xreferrer', code: 'ZERION' },
    });
    emitter.emit('typedDataSigned', {
      typedData: hyperliquidTypedData,
      address: '0x2222222222222222222222222222222222222222',
      initiator: 'https://app.hyperliquid.xyz/trade',
      clientScope: 'External Dapp',
    });
    await flushTransaction();

    expect(mixpanelSetUserProperties).toHaveBeenCalledWith({
      hyperliquid_referred: true,
      hyperliquid_referrer_code: 'ZERION',
    });

    vi.mocked(mixpanelSetUserProperties).mockClear();
    vi.mocked(perpReferral).mockClear();
    emitter.emit('typedDataSigned', {
      typedData: hyperliquidTypedData,
      address: '0x2222222222222222222222222222222222222222',
      initiator: 'https://app.hyperliquid.xyz.evil.test',
      clientScope: 'External Dapp',
    });
    await flushTransaction();
    expect(perpReferral).not.toHaveBeenCalled();
    expect(mixpanelSetUserProperties).not.toHaveBeenCalled();
  });

  test('a failed referral lookup does not write a false status', async () => {
    vi.mocked(perpReferral).mockResolvedValue(null);
    emitter.emit('typedDataSigned', {
      typedData: hyperliquidTypedData,
      address: '0x3333333333333333333333333333333333333333',
      initiator: 'https://app.hyperliquid.xyz',
      clientScope: 'External Dapp',
    });
    await flushTransaction();
    expect(mixpanelSetUserProperties).not.toHaveBeenCalled();
  });
});
