import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ZerionApiContext } from '../zerion-api-bare';
import type {
  Payload,
  PendingActionWire,
  WalletActionsWireResponse,
} from './wallet-get-actions';

const post = jest.fn<(options: { body: string }) => Promise<unknown>>();

// The real http client reads package.json, which ESM jest cannot import by name
jest.unstable_mockModule('src/modules/zerion-api/shared', () => ({
  CLIENT_DEFAULTS: { source: 'mainnet' },
  ZerionHttpClient: { post },
}));
const { walletGetActions } = await import('./wallet-get-actions');

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';

const context: ZerionApiContext = {
  getAddressProviderHeader: async () => 'zerion',
  getKyOptions: () => ({}),
};

const wireResponse: WalletActionsWireResponse = {
  data: [],
  meta: { pagination: { cursor: 'next' } },
};

async function requestBody(params: Omit<Payload, 'currency' | 'addresses'>) {
  await walletGetActions.call(context, {
    currency: 'usd',
    addresses: [ADDRESS],
    ...params,
  });
  expect(post).toHaveBeenCalledTimes(1);
  return JSON.parse(post.mock.calls[0][0].body);
}

describe('walletGetActions request body', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue(wireResponse);
  });

  it('first page without includePending: the key is absent', async () => {
    expect(await requestBody({})).not.toHaveProperty('includePending');
  });

  it('first page with includePending: sends includePending true', async () => {
    expect(await requestBody({ includePending: true })).toMatchObject({
      includePending: true,
    });
  });

  it('cursor page with includePending: the key is absent', async () => {
    const body = await requestBody({ includePending: true, cursor: 'next' });
    expect(body).not.toHaveProperty('includePending');
    expect(body.cursor).toBe('next');
  });

  it('sends since in unix seconds as given', async () => {
    expect(await requestBody({ since: 1791295200 })).toMatchObject({
      since: 1791295200,
    });
  });
});

describe('walletGetActions response', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('normalizes the pending lists next to the actions timestamps', async () => {
    const pendingRow: PendingActionWire = {
      address: ADDRESS,
      id: '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d',
      timestamp: 1791291600,
      status: null,
      type: { value: 'send', displayValue: 'Send' },
      label: null,
      fee: null,
      refund: null,
      transaction: null,
      content: null,
      acts: [],
      availableAt: 1791295200,
    };
    post.mockResolvedValue({
      ...wireResponse,
      data: [{ ...pendingRow, status: 'confirmed', acts: null }],
      pending: [],
      unsigned: [pendingRow],
    });
    const response = await walletGetActions.call(context, {
      currency: 'usd',
      addresses: [ADDRESS],
      includePending: true,
    });
    expect(response.data[0].timestamp).toBe(1791291600000);
    expect(response.pending).toStrictEqual([]);
    expect(response.unsigned).toHaveLength(1);
    expect(response.unsigned[0]).toMatchObject({
      status: 'unsigned',
      pendingActionId: '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d',
      timestamp: 1791291600000,
      availableAt: 1791295200000,
      expiresAt: null,
    });
    expect(response.pendingListsAvailable).toBe(true);
  });
});
