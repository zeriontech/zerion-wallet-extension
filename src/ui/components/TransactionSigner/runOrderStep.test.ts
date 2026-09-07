import { describe, expect, jest, test } from '@jest/globals';
import type {
  IntentApprovePayload,
  IntentSwapPayload,
  Quote2,
} from 'src/shared/types/Quote';
import type { OrderWaitResult } from 'src/ui/transactions/useLocalTransactionStatus';
import { OrderFailedError, RequoteError } from './errors';
import {
  runOrderStep,
  withFreshOutputAmount,
  type RunOrderStepDeps,
} from './runOrderStep';
import type { OrderStepParams, QueueEvent } from './types';

const EVM_DOC = {
  types: {},
  primaryType: 'Order',
  domain: { chainId: 8453 },
  message: {},
};

function makeQuote(overrides: Partial<Quote2> = {}): Quote2 {
  return {
    contractMetadata: { id: 'zerox', name: '0x', iconUrl: '', explorer: null },
    quoteId: 'q-1',
    error: null,
    transactionApprove: null,
    transactionSwap: null,
    intentApprove: null,
    intentSwap: { evm: EVM_DOC, solana: null },
    outputAmount: {
      currency: 'usd',
      quantity: '100',
      value: 100,
      usdValue: 100,
    },
    ...overrides,
  } as Quote2;
}

function makeParams(overrides: Partial<OrderStepParams> = {}): OrderStepParams {
  return {
    chain: 'base',
    feeValueCommon: '0',
    initiator: 'chrome-extension://id',
    clientScope: 'Swap',
    addressAction: null,
    quote: makeQuote(),
    outputChain: 'base',
    requote: null,
    order: {
      from: '0x1111111111111111111111111111111111111111',
      inputChain: 'base',
      outputChain: 'base',
      explorerUrlTemplate: 'https://basescan.org/tx/{HASH}',
    },
    ...overrides,
  };
}

function makeDeps(
  overrides: Partial<RunOrderStepDeps> = {}
): RunOrderStepDeps & { events: QueueEvent[] } {
  const events: QueueEvent[] = [];
  return {
    events,
    requote: jest.fn(async () => makeQuote({ quoteId: 'q-fresh' })),
    signIntent: jest.fn(
      async (intent: IntentSwapPayload | IntentApprovePayload) =>
        intent.evm ? '0xsig' : 'base64sig'
    ),
    submitOrder: jest.fn(async () => ({ orderId: 'zerox:abc' })),
    waitForOrder: jest.fn(async (): Promise<OrderWaitResult> => 'confirmed'),
    emit: (event) => events.push(event),
    orderWaitMs: 10,
    ...overrides,
  };
}

const types = (events: QueueEvent[]) => events.map((e) => e.type);

describe('runOrderStep', () => {
  test('permit + intent: signs both, omits nothing, waits for confirmation', async () => {
    const deps = makeDeps();
    const params = makeParams({
      quote: makeQuote({ intentApprove: { evm: EVM_DOC, solana: null } }),
    });
    const result = await runOrderStep({ params, index: 0, deps });
    expect(result).toEqual({
      order: { orderId: 'zerox:abc', status: 'confirmed' },
    });
    expect(deps.signIntent).toHaveBeenCalledTimes(2);
    const submitted = (deps.submitOrder as jest.Mock).mock.calls[0][0] as {
      quoteId: string;
      signatureSwap: string;
      signatureApprove?: string;
    };
    expect(submitted.quoteId).toBe('q-1');
    expect(submitted.signatureSwap).toBe('0xsig');
    expect(submitted.signatureApprove).toBe('0xsig');
    expect(types(deps.events)).toEqual(['step-signing', 'step-order-pending']);
  });

  test('intent only: the signatureApprove key is absent from the body', async () => {
    const deps = makeDeps();
    await runOrderStep({ params: makeParams(), index: 0, deps });
    const submitted = (deps.submitOrder as jest.Mock).mock
      .calls[0][0] as object;
    expect('signatureApprove' in submitted).toBe(false);
    expect(deps.signIntent).toHaveBeenCalledTimes(1);
  });

  test('approve + requote + intent: signs the fresh quote and reports its quoteId', async () => {
    const deps = makeDeps({
      requote: jest.fn(async () =>
        makeQuote({
          quoteId: 'q-fresh',
          intentApprove: { evm: EVM_DOC, solana: null },
          outputAmount: {
            currency: 'usd',
            quantity: '99',
            value: 99,
            usdValue: 99,
          },
        })
      ),
    });
    const addressAction = {
      content: {
        approvals: null,
        transfers: [
          {
            direction: 'out',
            amount: { quantity: '1' },
            fungible: null,
            nft: null,
          },
          {
            direction: 'in',
            amount: { quantity: '100' },
            fungible: null,
            nft: null,
          },
        ],
      },
    } as never;
    const params = makeParams({
      addressAction,
      requote: {
        address: '0x1',
        currency: 'usd',
        formState: { inputChain: 'base' },
        providerId: 'zerox',
      },
    });
    await runOrderStep({ params, index: 1, deps });
    expect(deps.requote).toHaveBeenCalledTimes(1);
    const submitted = (deps.submitOrder as jest.Mock).mock.calls[0][0] as {
      quoteId: string;
      signatureApprove?: string;
      orderContext: {
        quote: Quote2;
        addressAction: {
          content: {
            transfers: Array<{
              direction: string;
              amount: { quantity: string };
            }>;
          };
        };
      };
    };
    expect(submitted.quoteId).toBe('q-fresh');
    // Fresh permit replaces the (absent) earlier one
    expect(submitted.signatureApprove).toBe('0xsig');
    expect(submitted.orderContext.quote.quoteId).toBe('q-fresh');
    expect(
      submitted.orderContext.addressAction.content.transfers[1].amount.quantity
    ).toBe('99');
    expect(types(deps.events)).toEqual([
      'step-requoting',
      'step-signing',
      'step-order-pending',
    ]);
    expect(deps.events[0]).toMatchObject({ index: 1 });
  });

  test('requote failure propagates as RequoteError before any signing', async () => {
    const deps = makeDeps({
      requote: jest.fn(async () => {
        throw new RequoteError('quote-refresh-timeout', 'approve-required');
      }),
    });
    const params = makeParams({
      requote: {
        address: '0x1',
        currency: 'usd',
        formState: {},
        providerId: 'zerox',
      },
    });
    await expect(
      runOrderStep({ params, index: 1, deps })
    ).rejects.toBeInstanceOf(RequoteError);
    expect(deps.signIntent).not.toHaveBeenCalled();
    expect(deps.submitOrder).not.toHaveBeenCalled();
  });

  test('execute-order rejection propagates unchanged and no order-pending is emitted', async () => {
    const boom = Object.assign(new Error('400'), {
      code: 5400,
      data: { status: 400, body: 'stale' },
    });
    const deps = makeDeps({
      submitOrder: jest.fn(async () => {
        throw boom;
      }),
    });
    await expect(
      runOrderStep({ params: makeParams(), index: 0, deps })
    ).rejects.toBe(boom);
    expect(types(deps.events)).toEqual(['step-signing']);
  });

  test('order rejected/failed → OrderFailedError', async () => {
    const deps = makeDeps({
      waitForOrder: jest.fn(async (): Promise<OrderWaitResult> => 'failed'),
    });
    const error = await runOrderStep({
      params: makeParams(),
      index: 0,
      deps,
    }).catch((e) => e);
    expect(error).toBeInstanceOf(OrderFailedError);
    expect(error.orderId).toBe('zerox:abc');
  });

  test('order still pending after the wait → still-processing event + timeout result', async () => {
    const deps = makeDeps({
      waitForOrder: jest.fn(async (): Promise<OrderWaitResult> => 'timeout'),
    });
    const result = await runOrderStep({ params: makeParams(), index: 0, deps });
    expect(result).toEqual({
      order: { orderId: 'zerox:abc', status: 'timeout' },
    });
    expect(types(deps.events)).toEqual([
      'step-signing',
      'step-order-pending',
      'step-still-processing',
    ]);
    expect(deps.waitForOrder).toHaveBeenCalledWith('zerox:abc', 10);
  });

  test('user denial from the signer propagates (queue maps it to aborted)', async () => {
    const denied = Object.assign(new Error('denied'), { name: 'AbortError' });
    const deps = makeDeps({
      signIntent: jest.fn(async () => {
        throw denied;
      }),
    });
    await expect(
      runOrderStep({ params: makeParams(), index: 0, deps })
    ).rejects.toBe(denied);
    expect(deps.submitOrder).not.toHaveBeenCalled();
  });

  test('solana intent: signatureSwap is the base64 signed transaction', async () => {
    const deps = makeDeps();
    const params = makeParams({
      quote: makeQuote({
        intentSwap: { evm: null, solana: 'AQID' as never },
      }),
    });
    await runOrderStep({ params, index: 0, deps });
    const submitted = (deps.submitOrder as jest.Mock).mock.calls[0][0] as {
      signatureSwap: string;
    };
    expect(submitted.signatureSwap).toBe('base64sig');
  });
});

describe('withFreshOutputAmount', () => {
  test('only touches a single incoming transfer', () => {
    const quote = makeQuote({
      outputAmount: { currency: 'usd', quantity: '5', value: 5, usdValue: 5 },
    });
    expect(withFreshOutputAmount(null, quote)).toBeNull();
    const two = {
      content: {
        approvals: null,
        transfers: [
          { direction: 'in', amount: { quantity: '1' } },
          { direction: 'in', amount: { quantity: '2' } },
        ],
      },
    } as never;
    expect(withFreshOutputAmount(two, quote)).toBe(two);
  });
});
