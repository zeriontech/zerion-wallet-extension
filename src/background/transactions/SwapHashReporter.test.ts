import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { HTTPError, TimeoutError } from 'ky';
import type {
  ExecuteOrderPayload,
  Response as ExecuteOrderResponse,
} from 'src/modules/zerion-api/requests/transaction-execute-order';
import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type {
  OrderReport,
  TransactionContextParams,
} from 'src/shared/types/SignatureContextParams';
import { emitter } from '../events';
import {
  HASH_REPORT_WAIT_MS,
  SwapHashReporter,
  buildHashReportPayload,
} from './SwapHashReporter';

const EVM_HASH =
  '0xAbC0000000000000000000000000000000000000000000000000000000000DeF';
const EVM_HASH_LOWER = EVM_HASH.toLowerCase();
const APPROVE_HASH =
  '0x1230000000000000000000000000000000000000000000000000000000000789';
const SOLANA_SIGNATURE =
  '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const ORDER_RESPONSE: ExecuteOrderResponse = { data: { orderId: 'order_1' } };
const API_URL = 'https://api.example/transaction/execute-order/v1';

function evmResult(hash: string): SignTransactionResult {
  return { evm: { hash } as SerializableTransactionResponse };
}

function solanaResult(signature: string): SignTransactionResult {
  return { solana: { signature, publicKey: 'pk', tx: 'tx' as StringBase64 } };
}

function txContext(
  orderReport?: OrderReport,
  mode: 'default' | 'testnet' = 'default'
): { mode: 'default' | 'testnet' } & TransactionContextParams {
  return {
    mode,
    chain: 'ethereum',
    feeValueCommon: '0',
    initiator: 'chrome-extension://zerion',
    clientScope: 'Swap',
    addressAction: null,
    orderReport,
  };
}

function httpError(status: number) {
  return new HTTPError(
    new Response(null, { status }),
    new Request(API_URL),
    {} as never
  );
}

type ExecuteOrder = (p: ExecuteOrderPayload) => Promise<ExecuteOrderResponse>;

function recordingClient(outcome: (attempt: number) => unknown) {
  const callTimes: number[] = [];
  const executeOrder = jest.fn<ExecuteOrder>(async () => {
    callTimes.push(Date.now());
    const result = outcome(callTimes.length);
    if (result instanceof Error) {
      throw result;
    }
    return result as ExecuteOrderResponse;
  });
  const waits = () => callTimes.slice(1).map((t, i) => t - callTimes[i]);
  return { executeOrder, waits };
}

let consoleError: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  jest.useFakeTimers({ now: 1_791_291_600_000 });
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  consoleError.mockRestore();
});

describe('swap-role report retries', () => {
  const classes: ReadonlyArray<
    readonly [string, () => unknown, 'retry' | 'final']
  > = [
    ['TypeError (network)', () => new TypeError('Failed to fetch'), 'retry'],
    ['ky TimeoutError', () => new TimeoutError(new Request(API_URL)), 'retry'],
    ...[429, 500, 502, 503].map(
      (status) => [`HTTP ${status}`, () => httpError(status), 'retry'] as const
    ),
    ...[400, 401, 403, 404, 409, 422].map(
      (status) => [`HTTP ${status}`, () => httpError(status), 'final'] as const
    ),
  ];

  it.each(classes)('%s', async (_, makeError, kind) => {
    const { executeOrder, waits } = recordingClient(makeError);
    const reporter = new SwapHashReporter(executeOrder);
    const report = reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(report).resolves.toBeNull();
    if (kind === 'retry') {
      expect(executeOrder).toHaveBeenCalledTimes(4);
      expect(waits()).toEqual([1000, 2000, 4000]);
    } else {
      expect(executeOrder).toHaveBeenCalledTimes(1);
      expect(waits()).toEqual([]);
    }
    expect(consoleError).toHaveBeenCalledTimes(1);
    const line = String(consoleError.mock.calls[0][0]);
    expect(line).toContain('q_123');
    expect(line).toContain(EVM_HASH_LOWER.slice(0, 10));
    expect(line).not.toContain(EVM_HASH_LOWER.slice(0, 11));
  });

  it('HTTP 200', async () => {
    const { executeOrder, waits } = recordingClient(() => ORDER_RESPONSE);
    const reporter = new SwapHashReporter(executeOrder);
    const report = reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(report).resolves.toBe('order_1');
    expect(executeOrder).toHaveBeenCalledTimes(1);
    expect(waits()).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('a transient failure followed by 200 resolves the orderId', async () => {
    const { executeOrder, waits } = recordingClient((attempt) =>
      attempt < 3 ? httpError(503) : ORDER_RESPONSE
    );
    const reporter = new SwapHashReporter(executeOrder);
    const report = reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(report).resolves.toBe('order_1');
    expect(waits()).toEqual([1000, 2000]);
  });
});

describe('step-role report retries', () => {
  it('fails twice then succeeds: 3 attempts 3000 ms apart', async () => {
    const { executeOrder, waits } = recordingClient((attempt) =>
      attempt < 3 ? httpError(400) : ORDER_RESPONSE
    );
    const reporter = new SwapHashReporter(executeOrder);
    const report = reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_step', role: 'step' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(report).resolves.toBe('order_1');
    expect(executeOrder).toHaveBeenCalledTimes(3);
    expect(waits()).toEqual([3000, 3000]);
    for (const [payload] of executeOrder.mock.calls) {
      expect(payload).toStrictEqual({
        quoteId: 'q_step',
        signatureSwap: EVM_HASH_LOWER,
      });
    }
  });

  it('fails three times: stops after 3 attempts with null', async () => {
    const { executeOrder, waits } = recordingClient(() => httpError(400));
    const reporter = new SwapHashReporter(executeOrder);
    const report = reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_step', role: 'step' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(report).resolves.toBeNull();
    expect(executeOrder).toHaveBeenCalledTimes(3);
    expect(waits()).toEqual([3000, 3000]);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});

describe('buildHashReportPayload', () => {
  it('lowercases a mixed-case 0x hash', () => {
    expect(
      buildHashReportPayload({ quoteId: 'q_123', swapHash: EVM_HASH })
    ).toStrictEqual({ quoteId: 'q_123', signatureSwap: EVM_HASH_LOWER });
  });

  it('sends a base58 Solana signature unchanged', () => {
    expect(
      buildHashReportPayload({ quoteId: 'q_123', swapHash: SOLANA_SIGNATURE })
    ).toStrictEqual({ quoteId: 'q_123', signatureSwap: SOLANA_SIGNATURE });
  });

  it('adds signatureApprove only when an approve hash is given', () => {
    expect(
      buildHashReportPayload({
        quoteId: 'q_123',
        swapHash: EVM_HASH,
        approveHash: APPROVE_HASH,
      })
    ).toStrictEqual({
      quoteId: 'q_123',
      signatureSwap: EVM_HASH_LOWER,
      signatureApprove: APPROVE_HASH,
    });
    expect(
      buildHashReportPayload({
        quoteId: 'q_123',
        swapHash: EVM_HASH,
        approveHash: null,
      })
    ).not.toHaveProperty('signatureApprove');
  });
});

describe('transactionSent subscriber', () => {
  let executeOrder: jest.Mock<ExecuteOrder>;
  let unsubscribe: () => void;

  beforeEach(() => {
    executeOrder = jest.fn<ExecuteOrder>(async () => ORDER_RESPONSE);
    unsubscribe = new SwapHashReporter(executeOrder).addListeners();
  });

  afterEach(() => {
    unsubscribe();
  });

  it('a swap-role event sends exactly one report', async () => {
    emitter.emit(
      'transactionSent',
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder).toHaveBeenCalledTimes(1);
    expect(executeOrder).toHaveBeenCalledWith({
      quoteId: 'q_123',
      signatureSwap: EVM_HASH_LOWER,
    });
  });

  it('approve then swap with the same quoteId reports both hashes in one request', async () => {
    emitter.emit(
      'transactionSent',
      evmResult(APPROVE_HASH),
      txContext({ quoteId: 'q_123', role: 'approve' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder).not.toHaveBeenCalled();
    emitter.emit(
      'transactionSent',
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(executeOrder.mock.calls[0][0])).toBe(
      `{"quoteId":"q_123","signatureSwap":"${EVM_HASH_LOWER}","signatureApprove":"${APPROVE_HASH}"}`
    );
  });

  it('an approve for another quoteId does not attach signatureApprove', async () => {
    emitter.emit(
      'transactionSent',
      evmResult(APPROVE_HASH),
      txContext({ quoteId: 'q_other', role: 'approve' })
    );
    emitter.emit(
      'transactionSent',
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder).toHaveBeenCalledTimes(1);
    expect(executeOrder.mock.calls[0][0]).not.toHaveProperty(
      'signatureApprove'
    );
  });

  it('a Solana swap reports the signature unchanged', async () => {
    emitter.emit(
      'transactionSent',
      solanaResult(SOLANA_SIGNATURE),
      txContext({ quoteId: 'q_sol', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder).toHaveBeenCalledWith({
      quoteId: 'q_sol',
      signatureSwap: SOLANA_SIGNATURE,
    });
  });

  it.each<[string, SignTransactionResult, ReturnType<typeof txContext>]>([
    [
      'approve-role alone',
      evmResult(APPROVE_HASH),
      txContext({ quoteId: 'q_123', role: 'approve' }),
    ],
    ['no orderReport', evmResult(EVM_HASH), txContext()],
    [
      'testnet mode',
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' }, 'testnet'),
    ],
    [
      "swap with quoteId ''",
      evmResult(EVM_HASH),
      txContext({ quoteId: '', role: 'swap' }),
    ],
    [
      "step with quoteId ''",
      evmResult(EVM_HASH),
      txContext({ quoteId: '', role: 'step' }),
    ],
  ])('%s sends no report', async (_, result, context) => {
    emitter.emit('transactionSent', result, context);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder).not.toHaveBeenCalled();
  });

  it("an approve with quoteId '' is not remembered for a later swap", async () => {
    emitter.emit(
      'transactionSent',
      evmResult(APPROVE_HASH),
      txContext({ quoteId: '', role: 'approve' })
    );
    emitter.emit(
      'transactionSent',
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(executeOrder.mock.calls[0][0]).not.toHaveProperty(
      'signatureApprove'
    );
  });
});

describe('getReportedOrderId', () => {
  it('resolves the orderId of a reported hash, whatever its case', async () => {
    const reporter = new SwapHashReporter(async () => ORDER_RESPONSE);
    reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    const orderId = reporter.getReportedOrderId(EVM_HASH_LOWER);
    await jest.advanceTimersByTimeAsync(0);
    await expect(orderId).resolves.toBe('order_1');
  });

  it('resolves the orderId when asked before the hash is reported', async () => {
    const reporter = new SwapHashReporter(async () => ORDER_RESPONSE);
    const orderId = reporter.getReportedOrderId(EVM_HASH);
    await jest.advanceTimersByTimeAsync(1000);
    reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    await jest.advanceTimersByTimeAsync(0);
    await expect(orderId).resolves.toBe('order_1');
  });

  it('resolves null after a failed report', async () => {
    const reporter = new SwapHashReporter(async () => {
      throw httpError(400);
    });
    reporter.handleTransactionSent(
      evmResult(EVM_HASH),
      txContext({ quoteId: 'q_123', role: 'swap' })
    );
    const orderId = reporter.getReportedOrderId(EVM_HASH);
    await jest.advanceTimersByTimeAsync(0);
    await expect(orderId).resolves.toBeNull();
  });

  it(`resolves null after ${HASH_REPORT_WAIT_MS} ms when no report settles`, async () => {
    const reporter = new SwapHashReporter(async () => ORDER_RESPONSE);
    let settled: string | null | undefined;
    reporter.getReportedOrderId(EVM_HASH).then((value) => {
      settled = value;
    });
    await jest.advanceTimersByTimeAsync(4999);
    expect(settled).toBeUndefined();
    await jest.advanceTimersByTimeAsync(1);
    expect(settled).toBeNull();
  });
});
