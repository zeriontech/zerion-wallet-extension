import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Options as KyOptions } from 'ky';
import type { ZerionApiContext } from '../zerion-api-bare';

type CapturedOptions = { endpoint: string; body?: string };
type Client = (
  options: CapturedOptions,
  kyOptions: KyOptions
) => Promise<unknown>;

const get = jest.fn<Client>();
const post = jest.fn<Client>();

// The real http client reads package.json, which ESM jest cannot import by name
jest.unstable_mockModule('src/modules/zerion-api/shared', () => ({
  CLIENT_DEFAULTS: { source: 'mainnet' },
  ZerionHttpClient: { get, post },
}));
const { transactionExecuteOrder } = await import('./transaction-execute-order');
const { transactionGetOrderStatus, isTerminalOrderStatus } = await import(
  './transaction-get-order-status'
);
const { transactionBuildAction } = await import('./transaction-build-action');
const { transactionDismissAction } = await import(
  './transaction-dismiss-action'
);

const context: ZerionApiContext = {
  getAddressProviderHeader: async () => 'zerion',
  getKyOptions: () => ({ timeout: 30000 }),
};

function onlyCall(client: typeof get) {
  expect(client).toHaveBeenCalledTimes(1);
  const [options, kyOptions] = client.mock.calls[0];
  return { ...options, kyOptions };
}

describe('order API clients', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    get.mockResolvedValue({ data: null });
    post.mockResolvedValue({ data: null });
  });

  it('execute-order: POST with both signatures', async () => {
    await transactionExecuteOrder.call(context, {
      quoteId: 'q_123',
      signatureSwap: '0xabc',
      signatureApprove: '0x123',
    });
    const call = onlyCall(post);
    expect(get).not.toHaveBeenCalled();
    expect(call.endpoint).toBe('transaction/execute-order/v1');
    expect(call.body).toBe(
      '{"quoteId":"q_123","signatureSwap":"0xabc","signatureApprove":"0x123"}'
    );
    expect(call.kyOptions).toEqual({ timeout: 30000, retry: 0 });
  });

  it.each([
    ['absent', undefined],
    ['empty', ''],
  ])('execute-order: signatureApprove %s is omitted', async (_, value) => {
    await transactionExecuteOrder.call(context, {
      quoteId: 'q_123',
      signatureSwap: '0xabc',
      signatureApprove: value,
    });
    expect(onlyCall(post).body).toBe(
      '{"quoteId":"q_123","signatureSwap":"0xabc"}'
    );
  });

  it('get-order-status: GET with orderId and currency in the query', async () => {
    await transactionGetOrderStatus.call(context, {
      orderId: 'order_1',
      currency: 'usd',
    });
    const call = onlyCall(get);
    expect(post).not.toHaveBeenCalled();
    expect(call.endpoint).toBe(
      'transaction/get-order-status/v1?orderId=order_1&currency=usd'
    );
    expect(call.body).toBeUndefined();
    expect(call.kyOptions).toEqual({ timeout: 30000, retry: 0 });
  });

  it('build-action: POST with actionId', async () => {
    await transactionBuildAction.call(context, { actionId: 'act_1' });
    const call = onlyCall(post);
    expect(call.endpoint).toBe('transaction/build-action/v1');
    expect(call.body).toBe('{"actionId":"act_1"}');
    expect(call.kyOptions).toEqual({ timeout: 30000, retry: 0 });
  });

  it('dismiss-action: POST with actionId and proof', async () => {
    await transactionDismissAction.call(context, {
      actionId: 'act_1',
      proof: {
        address: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
        expireAt: 1791295200,
        signature: '0xdeadbeef',
      },
    });
    const call = onlyCall(post);
    expect(call.endpoint).toBe('transaction/dismiss-action/v1');
    expect(call.body).toBe(
      '{"actionId":"act_1","proof":{"address":"0x42b9df65b219b3dd36ff330a4dd8f327a6ada990","expireAt":1791295200,"signature":"0xdeadbeef"}}'
    );
    expect(call.kyOptions).toEqual({ timeout: 30000, retry: 0 });
  });

  it('isTerminalOrderStatus: everything but pending is terminal', () => {
    expect(isTerminalOrderStatus('pending')).toBe(false);
    expect(isTerminalOrderStatus('successful')).toBe(true);
    expect(isTerminalOrderStatus('failed')).toBe(true);
    expect(isTerminalOrderStatus('rejected')).toBe(true);
  });
});
