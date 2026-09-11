import { describe, expect, jest, test } from '@jest/globals';
import type { Quote2 } from 'src/shared/types/Quote';
import { RequoteError } from 'src/ui/components/TransactionSigner/errors';
import type { RequoteParams } from 'src/ui/components/TransactionSigner/types';
import {
  getUnusableReason,
  MAX_REQUOTE_ATTEMPTS,
  REQUOTE_RETRY_INTERVAL_MS,
  REQUOTE_TIMEOUT_MS,
  requoteIntent,
  type RequoteDeps,
} from './requoteIntent';

const PROVIDER = 'zerox';

function makeQuote(overrides: Partial<Quote2> = {}): Quote2 {
  return {
    contractMetadata: { id: PROVIDER, name: '0x', iconUrl: '', explorer: null },
    quoteId: 'q-1',
    error: null,
    transactionApprove: null,
    transactionSwap: null,
    intentApprove: null,
    intentSwap: {
      evm: { types: {}, primaryType: 'Order', domain: {}, message: {} },
      solana: null,
    },
    ...overrides,
  } as Quote2;
}

const PARAMS: RequoteParams = {
  address: '0x1111111111111111111111111111111111111111',
  currency: 'usd',
  formState: {
    inputChain: 'base',
    outputChain: 'base',
    inputFungibleId: 'eth',
    outputFungibleId: 'usdc',
    inputAmount: '1',
  },
  providerId: PROVIDER,
};

type Handlers = Parameters<RequoteDeps['openStream']>[1];

/** Scripted stream: each opened stream replays the next script entry */
function makeStreams(scripts: Array<(h: Handlers) => void>): {
  openStream: RequoteDeps['openStream'];
  opened: string[];
  closed: number;
} {
  const state = { opened: [] as string[], closed: 0 };
  const openStream: RequoteDeps['openStream'] = (url, handlers) => {
    state.opened.push(url);
    const script = scripts[state.opened.length - 1];
    // Run asynchronously like a real EventSource would
    Promise.resolve().then(() => script?.(handlers));
    return {
      close: () => {
        state.closed += 1;
      },
    };
  };
  return Object.assign(state, { openStream });
}

function makeClock() {
  let t = 1_000_000;
  return {
    now: () => t,
    delay: async (ms: number) => {
      t += ms;
    },
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe('requoteIntent', () => {
  test('returns the first usable intent quote from the same provider', async () => {
    const fresh = makeQuote({ quoteId: 'q-fresh' });
    const streams = makeStreams([
      (h) => {
        h.onUpdate([makeQuote({ contractMetadata: { id: 'other' } as never })]);
        h.onUpdate([fresh]);
      },
    ]);
    const clock = makeClock();
    const quote = await requoteIntent(PARAMS, { ...streams, ...clock });
    expect(quote.quoteId).toBe('q-fresh');
    expect(streams.opened).toHaveLength(1);
    expect(streams.opened[0]).toContain('/transaction/stream-swap-quotes/v3');
    expect(streams.opened[0]).toContain('from=0x1111');
    expect(streams.closed).toBe(1);
  });

  test('keeps waiting when the provider comes back as an on-chain swap', async () => {
    const onChain = makeQuote({
      intentSwap: null,
      transactionSwap: { evm: {} as never, solana: null },
    });
    const fresh = makeQuote({ quoteId: 'q-2' });
    const streams = makeStreams([
      (h) => {
        h.onUpdate([onChain]);
        h.onEnd();
      },
      (h) => {
        h.onUpdate([fresh]);
      },
    ]);
    const clock = makeClock();
    const quote = await requoteIntent(PARAMS, { ...streams, ...clock });
    expect(quote.quoteId).toBe('q-2');
    expect(streams.opened).toHaveLength(2);
  });

  test('retries every REQUOTE_RETRY_INTERVAL_MS while the approval is still requested', async () => {
    const stillApprove = makeQuote({
      transactionApprove: { evm: {} as never, solana: null },
    });
    const fresh = makeQuote({ quoteId: 'q-3' });
    const streams = makeStreams([
      (h) => {
        h.onUpdate([stillApprove]);
        h.onEnd();
      },
      (h) => {
        h.onUpdate([stillApprove]);
        h.onEnd();
      },
      (h) => h.onUpdate([fresh]),
    ]);
    const clock = makeClock();
    const start = clock.now();
    const quote = await requoteIntent(PARAMS, { ...streams, ...clock });
    expect(quote.quoteId).toBe('q-3');
    expect(clock.now() - start).toBe(2 * REQUOTE_RETRY_INTERVAL_MS);
  });

  test('fails with the last reason after MAX_REQUOTE_ATTEMPTS streams', async () => {
    const scripts = Array.from(
      { length: MAX_REQUOTE_ATTEMPTS },
      () => (h: Handlers) => {
        h.onUpdate([
          makeQuote({ error: { code: 1, message: 'nope' } as never }),
        ]);
        h.onEnd();
      }
    );
    const streams = makeStreams(scripts);
    const clock = makeClock();
    await expect(
      requoteIntent(PARAMS, { ...streams, ...clock })
    ).rejects.toMatchObject({
      name: 'RequoteError',
      kind: 'quote-refresh-failed',
      reason: 'quote-error',
    });
    expect(streams.opened).toHaveLength(MAX_REQUOTE_ATTEMPTS);
  });

  test('stream errors count as attempts and are reported', async () => {
    const scripts = Array.from(
      { length: MAX_REQUOTE_ATTEMPTS },
      () => (h: Handlers) => h.onError(new Error('500'))
    );
    const streams = makeStreams(scripts);
    const clock = makeClock();
    await expect(
      requoteIntent(PARAMS, { ...streams, ...clock })
    ).rejects.toMatchObject({ reason: 'stream-error' });
  });

  test('gives up with quote-refresh-timeout once REQUOTE_TIMEOUT_MS is spent', async () => {
    // Each stream ends without a usable quote and the clock jumps past the
    // budget between attempts.
    const clock = makeClock();
    const streams = makeStreams([
      (h) => {
        clock.advance(REQUOTE_TIMEOUT_MS);
        h.onEnd();
      },
    ]);
    const error = await requoteIntent(PARAMS, { ...streams, ...clock }).catch(
      (e) => e
    );
    expect(error).toBeInstanceOf(RequoteError);
    expect(error.kind).toBe('quote-refresh-timeout');
    expect(streams.opened).toHaveLength(1);
  });

  test('a stream that never ends is cut at the remaining budget', async () => {
    jest.useFakeTimers();
    try {
      const streams = makeStreams([() => undefined]);
      const clock = makeClock();
      const pending = requoteIntent(PARAMS, { ...streams, ...clock });
      // Attach handlers before the timer fires so the rejection is observed
      const outcome = pending.then(
        () => null,
        (error: RequoteError) => error
      );
      expect(streams.opened).toHaveLength(1);
      jest.advanceTimersByTime(REQUOTE_TIMEOUT_MS);
      const error = await outcome;
      expect(error).toBeInstanceOf(RequoteError);
      expect(error?.kind).toBe('quote-refresh-timeout');
      expect(error?.reason).toBe('timeout');
      expect(streams.closed).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('getUnusableReason', () => {
  test('classifies every unusable shape', () => {
    expect(getUnusableReason([], PROVIDER)).toBe('provider-missing');
    expect(
      getUnusableReason(
        [makeQuote({ error: { message: 'x' } as never })],
        PROVIDER
      )
    ).toBe('quote-error');
    expect(
      getUnusableReason(
        [makeQuote({ transactionApprove: { evm: {} as never, solana: null } })],
        PROVIDER
      )
    ).toBe('approve-required');
    expect(
      getUnusableReason(
        [
          makeQuote({
            intentSwap: null,
            transactionSwap: { evm: {} as never, solana: null },
          }),
        ],
        PROVIDER
      )
    ).toBe('on-chain-quote');
    expect(getUnusableReason([makeQuote({ quoteId: '' })], PROVIDER)).toBe(
      'on-chain-quote'
    );
    // intentApprove (a Permit) is fine: it's signed, not mined
    expect(
      getUnusableReason(
        [makeQuote({ intentApprove: { evm: {} as never, solana: null } })],
        PROVIDER
      )
    ).toBeNull();
  });
});
