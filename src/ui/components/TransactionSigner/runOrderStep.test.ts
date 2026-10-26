import BigNumber from 'bignumber.js';
import { HTTPError } from 'ky';
import { describe, expect, jest, test } from '@jest/globals';
import type { IntentMultichain, Quote2 } from 'src/shared/types/Quote';
import type { ExpectedIntentSigning } from 'src/ui/shared/forms/trading/intentTypedData';
import {
  ZEROX_GASLESS_PERMIT,
  ZEROX_GASLESS_TRADE,
} from 'src/ui/shared/forms/trading/intentTypedData.fixtures';
import {
  IntentVerificationError,
  OrderPlacementError,
  QuoteExpiredError,
} from './errors';
import { runOrderStep, type RunOrderStepDeps } from './runOrderStep';
import type { OrderStepParams, QueueEvent } from './types';

const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const OTHER_TOKEN = '0x1111111111111111111111111111111111111111';
/** Before both fixture deadlines (permit 1783515667, trade 1783429566) */
const NOW = 1_783_000_000;

const EXPECTED: ExpectedIntentSigning = {
  chainId: 8453,
  sellToken: BASE_USDC,
  maxSellAmount: new BigNumber('100000000'),
  nowSeconds: NOW,
};

const PERMIT: IntentMultichain = { evm: ZEROX_GASLESS_PERMIT, solana: null };
const TRADE: IntentMultichain = { evm: ZEROX_GASLESS_TRADE, solana: null };

function makeQuote(overrides: Partial<Quote2> = {}): Quote2 {
  return {
    contractMetadata: { id: 'zerox', name: '0x', iconUrl: '', explorer: null },
    quoteId: 'q-original',
    error: null,
    transactionApprove: null,
    transactionSwap: null,
    intentApprove: null,
    intentSwap: TRADE,
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
    expected: EXPECTED,
    ...overrides,
  } as OrderStepParams;
}

type MockedDeps = {
  signIntent: jest.Mock<RunOrderStepDeps['signIntent']>;
  executeOrder: jest.Mock<RunOrderStepDeps['executeOrder']>;
  reportOrderPlaced: jest.Mock<RunOrderStepDeps['reportOrderPlaced']>;
  reportExecuteOrderFailure: jest.Mock<
    RunOrderStepDeps['reportExecuteOrderFailure']
  >;
};

function makeDeps(
  overrides: Partial<MockedDeps & Omit<RunOrderStepDeps, keyof MockedDeps>> = {}
) {
  const events: QueueEvent[] = [];
  const deps = {
    signIntent: jest.fn<RunOrderStepDeps['signIntent']>(async (intent) =>
      intent === PERMIT ? '0xpermit-sig' : '0xintent-sig'
    ),
    executeOrder: jest.fn<RunOrderStepDeps['executeOrder']>(async () => ({
      orderId: 'zerox:abc',
    })),
    reportOrderPlaced: jest.fn<RunOrderStepDeps['reportOrderPlaced']>(
      async () => undefined
    ),
    reportExecuteOrderFailure:
      jest.fn<RunOrderStepDeps['reportExecuteOrderFailure']>(),
    emit: (event: QueueEvent) => {
      events.push(event);
    },
    address: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
    nowSeconds: () => NOW,
    signal: new AbortController().signal,
    ...overrides,
  };
  return { deps, events };
}

function httpError(status: number, body: string) {
  return new HTTPError(
    new Response(body, { status }),
    new Request('https://zpi.zerion.io/transaction/execute-order/v1'),
    {} as never
  );
}

describe('runOrderStep: approval shapes', () => {
  test('no approval: signs the original intent once and omits signatureApprove', async () => {
    const { deps, events } = makeDeps();
    const params = makeParams();
    const result = await runOrderStep({ params, index: 0, deps });

    expect(deps.signIntent.mock.calls).toEqual([[TRADE]]);
    expect(deps.executeOrder).toHaveBeenCalledTimes(1);
    const payload = deps.executeOrder.mock.calls[0][0];
    expect(payload).toEqual({
      quoteId: 'q-original',
      signatureSwap: '0xintent-sig',
    });
    expect('signatureApprove' in payload).toBe(false);
    expect(result).toEqual({ order: { orderId: 'zerox:abc' } });
    expect(events).toEqual([
      { type: 'step-signing', index: 0 },
      { type: 'step-order-placed', index: 0, orderId: 'zerox:abc' },
    ]);
  });

  test('intentApprove.evm: signs the permit, then the intent, and sends both', async () => {
    const { deps } = makeDeps();
    const params = makeParams({ quote: makeQuote({ intentApprove: PERMIT }) });
    await runOrderStep({ params, index: 0, deps });

    expect(deps.signIntent.mock.calls).toEqual([[PERMIT], [TRADE]]);
    expect(deps.executeOrder.mock.calls).toEqual([
      [
        {
          quoteId: 'q-original',
          signatureSwap: '0xintent-sig',
          signatureApprove: '0xpermit-sig',
        },
      ],
    ]);
  });

  test('a Solana intent has no typed data to validate and is signed as is', async () => {
    const solanaIntent: IntentMultichain = { evm: null, solana: 'AQID' };
    const { deps } = makeDeps();
    const params = makeParams({
      quote: makeQuote({ intentSwap: solanaIntent }),
      expected: null,
    });
    await runOrderStep({ params, index: 0, deps });
    expect(deps.signIntent.mock.calls).toEqual([[solanaIntent]]);
  });

  test('reports the placed order with its quote and context', async () => {
    const { deps } = makeDeps();
    const params = makeParams();
    await runOrderStep({ params, index: 0, deps });
    const { expected: _expected, ...context } = params;
    expect(deps.reportOrderPlaced.mock.calls).toEqual([
      [
        {
          orderId: 'zerox:abc',
          quoteId: 'q-original',
          address: deps.address,
          context,
        },
      ],
    ]);
  });
});

describe('runOrderStep: validation before any signature', () => {
  const invalid: Array<[string, Partial<OrderStepParams>]> = [
    ['wrong chain', { expected: { ...EXPECTED, chainId: 1 } }],
    ['wrong token', { expected: { ...EXPECTED, sellToken: OTHER_TOKEN } }],
    [
      'amount above input',
      { expected: { ...EXPECTED, maxSellAmount: new BigNumber('50000000') } },
    ],
  ];

  test.each(invalid)(
    '%s → IntentVerificationError with nothing signed',
    async (_name, overrides) => {
      const { deps } = makeDeps();
      const params = makeParams({
        quote: makeQuote({ intentApprove: PERMIT }),
        ...overrides,
      });
      await expect(
        runOrderStep({ params, index: 0, deps })
      ).rejects.toBeInstanceOf(IntentVerificationError);
      expect(deps.signIntent).not.toHaveBeenCalled();
      expect(deps.executeOrder).not.toHaveBeenCalled();
    }
  );

  test('an invalid permit blocks the intent too', async () => {
    const { deps } = makeDeps();
    const wrongChainPermit: IntentMultichain = {
      evm: {
        ...ZEROX_GASLESS_PERMIT,
        domain: { ...ZEROX_GASLESS_PERMIT.domain, chainId: 1 },
      },
      solana: null,
    };
    const params = makeParams({
      quote: makeQuote({ intentApprove: wrongChainPermit }),
    });
    await expect(
      runOrderStep({ params, index: 0, deps })
    ).rejects.toBeInstanceOf(IntentVerificationError);
    expect(deps.signIntent).not.toHaveBeenCalled();
  });

  test('past deadline only → QuoteExpiredError with nothing signed', async () => {
    const { deps } = makeDeps({ nowSeconds: () => 1_783_600_000 });
    const params = makeParams({ quote: makeQuote({ intentApprove: PERMIT }) });
    await expect(
      runOrderStep({ params, index: 0, deps })
    ).rejects.toBeInstanceOf(QuoteExpiredError);
    expect(deps.signIntent).not.toHaveBeenCalled();
    expect(deps.executeOrder).not.toHaveBeenCalled();
  });

  test('the deadline is checked at signing time, not at enqueue time', async () => {
    const { deps } = makeDeps({ nowSeconds: () => 1_783_500_000 });
    const params = makeParams();
    await expect(
      runOrderStep({ params, index: 0, deps })
    ).rejects.toBeInstanceOf(QuoteExpiredError);
  });

  test('past deadline with another problem → IntentVerificationError', async () => {
    const { deps } = makeDeps({ nowSeconds: () => 1_783_600_000 });
    const params = makeParams({ expected: { ...EXPECTED, chainId: 1 } });
    await expect(
      runOrderStep({ params, index: 0, deps })
    ).rejects.toBeInstanceOf(IntentVerificationError);
    expect(deps.signIntent).not.toHaveBeenCalled();
  });
});

describe('runOrderStep: execute-order failures', () => {
  const failures: Array<[string, () => Error, new (status: never) => Error]> = [
    ['400', () => httpError(400, 'quote expired'), QuoteExpiredError],
    ['422', () => httpError(422, 'bad signature'), OrderPlacementError],
    ['500', () => httpError(500, 'internal'), OrderPlacementError],
    ['503', () => httpError(503, 'unavailable'), OrderPlacementError],
    ['network', () => new TypeError('Failed to fetch'), OrderPlacementError],
  ];

  test.each(failures)(
    '%s → error class, one execute-order call, body logged',
    async (_name, makeError, ErrorClass) => {
      const error = makeError();
      const { deps, events } = makeDeps({
        executeOrder: jest.fn<RunOrderStepDeps['executeOrder']>(async () => {
          throw error;
        }),
      });
      await expect(
        runOrderStep({ params: makeParams(), index: 0, deps })
      ).rejects.toBeInstanceOf(ErrorClass);
      expect(deps.executeOrder).toHaveBeenCalledTimes(1);
      expect(deps.reportExecuteOrderFailure).toHaveBeenCalledTimes(1);
      expect(deps.reportOrderPlaced).not.toHaveBeenCalled();
      expect(events.map((e) => e.type)).toEqual(['step-signing']);
    }
  );

  test('the response body reaches client_error reporting', async () => {
    const { deps } = makeDeps({
      executeOrder: jest.fn<RunOrderStepDeps['executeOrder']>(async () => {
        throw httpError(422, '{"errors":[{"title":"invalid signature"}]}');
      }),
    });
    await runOrderStep({ params: makeParams(), index: 0, deps }).catch(
      () => null
    );
    expect(deps.reportExecuteOrderFailure).toHaveBeenCalledWith({
      status: 422,
      body: '{"errors":[{"title":"invalid signature"}]}',
    });
  });
});

describe('runOrderStep: rejection', () => {
  const denied = () =>
    Object.assign(new Error('denied'), { name: 'AbortError' });

  test('rejection at the permit: nothing else is signed or placed', async () => {
    const error = denied();
    const { deps } = makeDeps({
      signIntent: jest.fn<RunOrderStepDeps['signIntent']>(async () => {
        throw error;
      }),
    });
    const params = makeParams({ quote: makeQuote({ intentApprove: PERMIT }) });
    await expect(runOrderStep({ params, index: 0, deps })).rejects.toBe(error);
    expect(deps.signIntent).toHaveBeenCalledTimes(1);
    expect(deps.executeOrder).not.toHaveBeenCalled();
  });

  test('rejection at the intent: no order is placed', async () => {
    const error = denied();
    const signIntent = jest.fn<RunOrderStepDeps['signIntent']>(
      async (intent) => {
        if (intent === TRADE) throw error;
        return '0xpermit-sig';
      }
    );
    const { deps } = makeDeps({ signIntent });
    const params = makeParams({ quote: makeQuote({ intentApprove: PERMIT }) });
    await expect(runOrderStep({ params, index: 0, deps })).rejects.toBe(error);
    expect(signIntent).toHaveBeenCalledTimes(2);
    expect(deps.executeOrder).not.toHaveBeenCalled();
  });

  test('a queue cancelled while signing places no order', async () => {
    const controller = new AbortController();
    const { deps } = makeDeps({
      signal: controller.signal,
      signIntent: jest.fn<RunOrderStepDeps['signIntent']>(async () => {
        controller.abort();
        return '0xintent-sig';
      }),
    });
    await expect(
      runOrderStep({ params: makeParams(), index: 0, deps })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(deps.executeOrder).not.toHaveBeenCalled();
  });
});
