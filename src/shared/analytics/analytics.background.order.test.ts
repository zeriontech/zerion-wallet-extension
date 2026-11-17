import { beforeAll, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { Quote2 } from 'src/shared/types/Quote';

const { mixpanelTrack, sendToMetabase, gaCollect } = vi.hoisted(() => ({
  mixpanelTrack: vi.fn(),
  sendToMetabase: vi.fn(),
  gaCollect: vi.fn(),
}));

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getManifest: () => ({ version: '0.0.0' }),
      getURL: (path: string) => `chrome-extension://zerion/${path}`,
    },
    storage: { local: {}, session: {} },
  },
}));
vi.mock('src/shared/core/runtime-store', () => ({
  runtimeStore: {
    getState: () => ({ startupEvent: null, installedEvent: null }),
  },
}));
vi.mock('src/shared/packageVersion', () => ({
  version: '0.0.0-dev',
  productionVersion: '0.0.0',
}));
vi.mock('./mixpanel', () => ({
  mixpanelTrack,
  mixpanelIdentify: vi.fn(),
}));
vi.mock('./analytics', () => ({
  createParams: <T>(params: T) => params,
  sendToMetabase,
}));
vi.mock('./google-analytics', () => ({
  gaCollect,
  prepareGaParams: async <T>(params: T) => params,
}));
vi.mock('./analyticsId', () => ({
  waitForAnalyticsIdSet: async () => undefined,
}));
vi.mock('./shared/getUserProperties', () => ({
  getUserProperties: async () => ({}),
}));
vi.mock('src/background/account/Account', () => ({
  LoginActivity: {},
}));
vi.mock('src/background/Wallet/Wallet', () => ({
  INTERNAL_SYMBOL_CONTEXT: { origin: 'internal' },
}));
vi.mock('src/background/Wallet/GlobalPreferences', () => ({
  globalPreferences: {
    getPreferences: async () => ({ analyticsEnabled: true }),
    on: () => () => undefined,
  },
  getWalletNameFlagsChange: () => ({ enabled: [], disabled: [] }),
}));
vi.mock('src/modules/dna-service/dna.background', () => ({
  dnaServiceEmitter: { on: () => () => undefined },
}));
vi.mock('src/background/user-activity', () => ({
  estimateSessionExpiry: async () => null,
}));
vi.mock('src/modules/query-client/query-client.background', () => ({
  backgroundQueryClient: { fetchQuery: async () => null },
}));
vi.mock('src/modules/zerion-api/zerion-api.background', () => ({
  ZerionAPI: {},
}));

const { emitter } = await import('src/background/events');
const { initialize } = await import('./analytics.background');

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const ORIGIN = 'chrome-extension://zerion';

const quote = {
  contractMetadata: { id: 'zerox', name: '0x', iconUrl: '', explorer: null },
  quoteId: 'q-1',
  error: null,
  finalSlippage: 0.5,
  autoSlippage: null,
} as unknown as Quote2;

const context = {
  mode: 'default',
  chain: 'base',
  feeValueCommon: '0',
  initiator: `${ORIGIN}/sidepanel.html#/swap-form`,
  clientScope: 'Swap',
  addressAction: null,
  actionType: 'Trade',
  quote,
  outputChain: 'base',
} as { mode: 'default' } & TransactionContextParams;

const account = {
  getCurrentWallet: () => ({
    getWalletGroupByAddressSync: () => null,
    getPreferences: async () => ({ enableHoldToSignButton: false }),
    readCurrentAddress: () => ADDRESS,
  }),
  on: () => undefined,
  getUser: () => null,
};

async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

const signedTransactionCalls = () =>
  mixpanelTrack.mock.calls.filter(([event]) => event === 'Transaction: Signed Transaction');

describe('analytics.background: Signed Transaction', () => {
  beforeAll(() => {
    (globalThis as { location?: unknown }).location = { origin: ORIGIN };
    initialize({ account: account as never });
  });

  beforeEach(() => {
    mixpanelTrack.mockClear();
    sendToMetabase.mockClear();
  });

  test('orderPlaced is one Signed Transaction with order_id, quote_id and execution_type intent', async () => {
    const emit = vi.spyOn(emitter, 'emit');
    emitter.emit(
      'orderPlaced',
      { orderId: 'zerox:abc', quoteId: 'q-1', address: ADDRESS },
      context,
    );
    await flush();

    expect(signedTransactionCalls()).toHaveLength(1);
    const [, params] = signedTransactionCalls()[0] as [string, Record<string, unknown>];
    expect(params).toMatchObject({
      order_id: 'zerox:abc',
      quote_id: 'q-1',
      execution_type: 'intent',
      transaction_success: true,
      client_scope: 'Swap',
      ecosystem: 'EVM',
    });
    expect(sendToMetabase.mock.calls.map(([event]) => event as string)).toEqual([
      'signed_transaction',
    ]);
    expect(emit).not.toHaveBeenCalledWith('typedDataSigned', expect.anything());
    emit.mockRestore();
  });

  test('a wallet-sent transaction carries execution_type transaction', async () => {
    emitter.emit(
      'transactionSent',
      {
        evm: { hash: '0xhash', from: ADDRESS, gasLimit: 21000n },
      } as never,
      context,
    );
    await flush();

    expect(signedTransactionCalls()).toHaveLength(1);
    const [, params] = signedTransactionCalls()[0] as [string, Record<string, unknown>];
    expect(params.execution_type).toBe('transaction');
    expect(params).not.toHaveProperty('order_id');
  });
});
