import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { IntentMultichain, Quote2 } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { ExecuteOrderPayload } from 'src/modules/zerion-api/requests/transaction-execute-order';
import {
  ZEROX_GASLESS_PERMIT,
  ZEROX_GASLESS_TRADE,
} from 'src/ui/shared/forms/trading/intentTypedData.fixtures';
import { SeedType } from 'src/shared/SeedType';
import { emitter as backgroundEmitter } from 'src/background/events';
import { signSwapIntentPayload } from 'src/background/Wallet/helpers/signSwapIntentPayload';
import type { QueueEvent, SignStep } from './types';

const EVM_WALLET = new ethers.Wallet(
  '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318'
);
const ADDRESS = EVM_WALLET.address.toLowerCase();
const APPROVE_HASH = '0xapprovehash';

type Row = { hash: string; context: TransactionContextParams };

/** The background side of walletPort: a mnemonic wallet and the local transactions store */
const background = {
  methods: [] as string[],
  localRows: [] as Row[],
};

const walletPortRequest = jest.fn(
  async (method: string, params?: unknown): Promise<unknown> => {
    background.methods.push(method);
    if (method === 'getWalletGroupByAddress') {
      return {
        walletContainer: {
          seedType: SeedType.mnemonic,
          wallets: [{ address: ADDRESS }],
        },
      };
    }
    if (method === 'signSwapIntent') {
      const { intent } = params as { intent: IntentMultichain };
      return signSwapIntentPayload(intent, {
        getEvmSigner: () => EVM_WALLET,
        getSolanaKeypair: () => {
          throw new Error('no solana key');
        },
      });
    }
    if (method === 'signAndSendTransaction') {
      const [, context] = params as [unknown, TransactionContextParams];
      const result = { hash: APPROVE_HASH, from: ADDRESS, gasLimit: 1n };
      backgroundEmitter.emit('transactionSent', { evm: result } as never, {
        mode: 'default',
        ...context,
      });
      return result;
    }
    if (method === 'uiReportOrderPlaced') {
      return undefined;
    }
    throw new Error(`Unexpected walletPort method ${method}`);
  }
);
const executeOrder =
  jest.fn<
    (payload: ExecuteOrderPayload) => Promise<{ data: { orderId: string } }>
  >();
/** Settlement is never awaited by the queue */
const getOrderStatus = jest.fn(() => new Promise<never>(() => undefined));
const quoteStreamOpened = jest.fn();

jest.unstable_mockModule('src/ui/shared/channels', () => ({
  walletPort: { request: walletPortRequest },
}));
jest.unstable_mockModule('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: {
    transactionExecuteOrder: executeOrder,
    transactionGetOrderStatus: getOrderStatus,
  },
}));
jest.unstable_mockModule(
  'src/ui/transactions/useLocalTransactionStatus',
  () => ({ waitForTransactionResolve: async () => 'confirmed' })
);
jest.unstable_mockModule(
  'src/ui/hardware-wallet/useLedgerIframeController',
  () => ({
    getLedgerIframeController: () => null,
    postLedgerSignParams: () => undefined,
  })
);
jest.unstable_mockModule(
  'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction/HardwareSignTransaction',
  () => ({
    prepareForSignByLedger: jest.fn(),
    signRegularOrPaymasterTx: jest.fn(),
    signSolanaTransaction: jest.fn(),
  })
);
jest.unstable_mockModule(
  'src/ui/pages/HardwareWalletConnection/shared/messageHandler',
  () => ({ hardwareMessageHandler: {} })
);
jest.unstable_mockModule('src/modules/networks/networks-store.client', () => ({
  getNetworksStore: async () => {
    throw new Error('not used by software EVM steps');
  },
}));
jest.unstable_mockModule('./refreshStaleGas', () => ({
  isStepStale: () => false,
  refreshStaleGasForStep: async (step: SignStep) => step,
}));

const { appendQueue, getQueue, getQueues } = await import('./store');
const { runQueue } = await import('./runQueue');
const { runStep } = await import('./runStep');
const { QueueAbortError } = await import('./errors');

const PERMIT: IntentMultichain = { evm: ZEROX_GASLESS_PERMIT, solana: null };
const TRADE: IntentMultichain = { evm: ZEROX_GASLESS_TRADE, solana: null };

const context: TransactionContextParams = {
  chain: 'base',
  feeValueCommon: '0',
  initiator: 'chrome-extension://id',
  clientScope: 'Swap',
  addressAction: null,
};

function orderStep(quote: Partial<Quote2>): SignStep {
  return {
    kind: 'order',
    params: {
      ...context,
      quote: {
        quoteId: 'q-original',
        intentApprove: null,
        intentSwap: TRADE,
        transactionApprove: null,
        transactionSwap: null,
        ...quote,
      } as Quote2,
      outputChain: 'base',
      expected: {
        chainId: 8453,
        sellToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        maxSellAmount: new BigNumber('100000000'),
        nowSeconds: 0,
      },
    },
  };
}

const approveStep: SignStep = {
  kind: 'send',
  params: {
    ...context,
    actionType: 'Approve',
    transaction: {
      evm: { to: '0xusdc', from: ADDRESS },
    } as MultichainTransaction,
  },
};

async function run(steps: SignStep[]) {
  const events: QueueEvent[] = [];
  const { queueId, promise } = appendQueue(steps, {
    wallet: { address: ADDRESS, name: null },
    holdToSign: false,
    bluetoothSupportEnabled: null,
    onEvent: (event) => events.push(event),
  });
  const queue = getQueue(queueId);
  if (!queue) throw new Error('queue not appended');
  const settled = promise.then(
    (results) => ({ results, error: null }),
    (error: Error) => ({ results: null, error })
  );
  await runQueue(queue, runStep);
  return { events, queueId, ...(await settled) };
}

const signedDocuments = () =>
  walletPortRequest.mock.calls
    .filter(([method]) => method === 'signSwapIntent')
    .map(([, params]) => (params as { intent: IntentMultichain }).intent);

let unsubscribeTransactionSent: () => void;
let backgroundEmit: jest.SpiedFunction<typeof backgroundEmitter.emit>;
const realFetch = globalThis.fetch;
const realEventSource = (globalThis as { EventSource?: unknown }).EventSource;

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(1_783_000_000_000) });
  background.methods = [];
  background.localRows = [];
  walletPortRequest.mockClear();
  executeOrder.mockReset();
  executeOrder.mockResolvedValue({ data: { orderId: 'zerox:abc' } });
  getOrderStatus.mockClear();
  quoteStreamOpened.mockClear();
  globalThis.fetch = quoteStreamOpened as unknown as typeof fetch;
  (globalThis as { EventSource?: unknown }).EventSource = quoteStreamOpened;
  unsubscribeTransactionSent = backgroundEmitter.on(
    'transactionSent',
    (result, ctx) => {
      background.localRows.push({ hash: result.evm?.hash ?? '', context: ctx });
    }
  );
  backgroundEmit = jest.spyOn(backgroundEmitter, 'emit');
});

afterEach(() => {
  jest.useRealTimers();
  unsubscribeTransactionSent();
  backgroundEmit.mockRestore();
  globalThis.fetch = realFetch;
  (globalThis as { EventSource?: unknown }).EventSource = realEventSource;
});

describe('an order step in the signing queue', () => {
  test('permit-only: places the original quote and leaves no local History row', async () => {
    const { events, results, error } = await run([
      orderStep({ intentApprove: PERMIT }),
    ]);

    expect(error).toBeNull();
    expect(signedDocuments()).toEqual([PERMIT, TRADE]);
    expect(executeOrder).toHaveBeenCalledTimes(1);
    const payload = executeOrder.mock.calls[0][0];
    expect(payload.quoteId).toBe('q-original');
    expect(payload.signatureApprove).toMatch(/^0x[0-9a-f]{130}$/);
    expect(payload.signatureSwap).toMatch(/^0x[0-9a-f]{130}$/);
    expect(results).toEqual([{ order: { orderId: 'zerox:abc' } }]);
    expect(events).toContainEqual({
      type: 'step-order-placed',
      index: 0,
      orderId: 'zerox:abc',
    });

    expect(background.methods).not.toContain('signAndSendTransaction');
    expect(backgroundEmit).not.toHaveBeenCalledWith(
      'transactionSent',
      expect.anything(),
      expect.anything()
    );
    expect(backgroundEmit).not.toHaveBeenCalledWith(
      'typedDataSigned',
      expect.anything()
    );
    expect(background.localRows).toEqual([]);
    expect(quoteStreamOpened).not.toHaveBeenCalled();
  });

  test('resolves without waiting for settlement: the queue is gone while the order is pending', async () => {
    const { queueId } = await run([orderStep({})]);
    expect(getQueue(queueId)).toBeUndefined();
    expect(getQueues()).toHaveLength(0);
    expect(getOrderStatus).not.toHaveBeenCalled();
  });

  test('transactionApprove: the mined approval is the only local row and the original quote is signed', async () => {
    const { events, error } = await run([approveStep, orderStep({})]);

    expect(error).toBeNull();
    expect(
      background.methods.filter((m) => m === 'signAndSendTransaction')
    ).toHaveLength(1);
    expect(background.localRows).toHaveLength(1);
    expect(background.localRows[0].hash).toBe(APPROVE_HASH);
    expect(background.localRows[0].context.actionType).toBe('Approve');

    expect(signedDocuments()).toEqual([TRADE]);
    expect(executeOrder).toHaveBeenCalledTimes(1);
    expect(executeOrder.mock.calls[0][0].quoteId).toBe('q-original');
    expect('signatureApprove' in executeOrder.mock.calls[0][0]).toBe(false);
    expect(quoteStreamOpened).not.toHaveBeenCalled();
    expect(backgroundEmit).not.toHaveBeenCalledWith(
      'typedDataSigned',
      expect.anything()
    );

    const types = events.map((e) => `${e.type}:${'index' in e ? e.index : ''}`);
    expect(types).toContain('step-pending:0');
    expect(types).toContain('step-order-placed:1');
    expect(types.indexOf('step-pending:0')).toBeLessThan(
      types.indexOf('step-order-placed:1')
    );
  });

  test.each([
    ['the permit', PERMIT],
    ['the intent', TRADE],
  ])(
    'a device rejection at %s ends the queue as queue-aborted with no order placed',
    async (_name, rejected) => {
      const original = walletPortRequest.getMockImplementation();
      walletPortRequest.mockImplementation(async (method, params) => {
        if (
          method === 'signSwapIntent' &&
          (params as { intent: IntentMultichain }).intent === rejected
        ) {
          throw Object.assign(new Error('Rejected by user'), {
            name: 'AbortError',
          });
        }
        return original?.(method, params);
      });

      const { events, error } = await run([
        orderStep({ intentApprove: PERMIT }),
      ]);
      walletPortRequest.mockImplementation(original as never);

      expect(error).toBeInstanceOf(QueueAbortError);
      expect(events).toContainEqual({
        type: 'queue-aborted',
        reason: 'user-dismissed',
        index: 0,
      });
      expect(events.map((e) => e.type)).not.toContain('step-error');
      expect(executeOrder).not.toHaveBeenCalled();
    }
  );
});
