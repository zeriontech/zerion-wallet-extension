import type { Quote2 } from 'src/shared/types/Quote';
import { isIntentQuote } from 'src/shared/types/Quote';
import type { RequoteParams } from 'src/ui/components/TransactionSigner/types';
import {
  RequoteError,
  type RequoteFailureReason,
} from 'src/ui/components/TransactionSigner/errors';
import {
  createSwapQuotesSearchParams,
  resolveQuotesFormState,
  SWAP_QUOTES_V3_PATHNAME,
} from './swapQuotesRequest';

export const REQUOTE_RETRY_INTERVAL_MS = 2_000;
export const MAX_REQUOTE_ATTEMPTS = 5;
export const REQUOTE_TIMEOUT_MS = 30_000;

/** One open quote stream; `close` is idempotent */
export interface QuoteStream {
  close(): void;
}

export interface RequoteDeps {
  /**
   * Opens the v3 stream for a path relative to the API base
   * (`/transaction/stream-swap-quotes/v3?…`); calls back on every update, on
   * end, on error.
   */
  openStream: (
    path: string,
    handlers: {
      onUpdate: (quotes: Quote2[]) => void;
      onEnd: () => void;
      onError: (error: Error) => void;
    }
  ) => QuoteStream;
  now?: () => number;
  delay?: (ms: number) => Promise<void>;
}

/**
 * Why a fresh quote is not usable. Recorded so the failure message can tell
 * "the provider went away" from "the provider still wants an approval".
 */
export function getUnusableReason(
  quotes: Quote2[],
  providerId: string
): RequoteFailureReason | null {
  const quote = quotes.find((q) => q.contractMetadata?.id === providerId);
  if (!quote) return 'provider-missing';
  if (quote.error) return 'quote-error';
  if (quote.transactionApprove) return 'approve-required';
  // An On-chain Swap is deliberately not accepted (web-app parity): the user
  // signed up for an Intent Swap, so we keep waiting for one.
  if (!isIntentQuote(quote)) return 'on-chain-quote';
  return null;
}

export function findUsableIntentQuote(
  quotes: Quote2[],
  providerId: string
): Quote2 | null {
  return getUnusableReason(quotes, providerId) === null
    ? quotes.find((q) => q.contractMetadata?.id === providerId) ?? null
    : null;
}

type StreamOutcome =
  | { quote: Quote2 }
  | { quote: null; reason: RequoteFailureReason };

function runStream(
  url: string,
  providerId: string,
  budgetMs: number,
  deps: Required<RequoteDeps>
): Promise<StreamOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    let lastReason: RequoteFailureReason = 'provider-missing';
    let stream: QuoteStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (outcome: StreamOutcome) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      stream?.close();
      resolve(outcome);
    };
    timer = setTimeout(
      () => finish({ quote: null, reason: 'timeout' }),
      budgetMs
    );
    stream = deps.openStream(url, {
      onUpdate: (quotes) => {
        const reason = getUnusableReason(quotes, providerId);
        if (reason === null) {
          const quote = quotes.find(
            (q) => q.contractMetadata?.id === providerId
          );
          if (quote) {
            finish({ quote });
            return;
          }
        } else {
          lastReason = reason;
        }
      },
      onEnd: () => finish({ quote: null, reason: lastReason }),
      onError: () => finish({ quote: null, reason: 'stream-error' }),
    });
    if (settled) {
      // openStream may have called back synchronously
      stream.close();
    }
  });
}

/**
 * Re-quote: after an On-chain Approval is mined, re-open the v3 stream with
 * the original request and wait for the same provider to return an Intent Swap
 * that needs no approval. Streams are retried every REQUOTE_RETRY_INTERVAL_MS,
 * at most MAX_REQUOTE_ATTEMPTS times, all within REQUOTE_TIMEOUT_MS.
 */
export async function requoteIntent(
  params: RequoteParams,
  depsOverride: Partial<RequoteDeps> = {}
): Promise<Quote2> {
  // The EventSource-backed stream is loaded lazily so tests that inject
  // `openStream` don't pull the eventsource/store-unit runtime into jest.
  const openStream =
    depsOverride.openStream ??
    (await import('./requoteStream')).openQuoteStream;
  const deps: Required<RequoteDeps> = {
    openStream,
    now: depsOverride.now ?? Date.now,
    delay:
      depsOverride.delay ??
      ((ms: number) => new Promise((r) => setTimeout(r, ms))),
  };
  const formState = resolveQuotesFormState(params.formState);
  if (!formState) {
    throw new RequoteError('quote-refresh-failed', null);
  }
  const url = `${SWAP_QUOTES_V3_PATHNAME}?${createSwapQuotesSearchParams({
    address: params.address,
    currency: params.currency,
    formState,
  })}`;
  const deadline = deps.now() + REQUOTE_TIMEOUT_MS;
  let lastReason: RequoteFailureReason | null = null;
  for (let attempt = 1; attempt <= MAX_REQUOTE_ATTEMPTS; attempt++) {
    const remaining = deadline - deps.now();
    if (remaining <= 0) {
      throw new RequoteError('quote-refresh-timeout', lastReason);
    }
    const outcome = await runStream(url, params.providerId, remaining, deps);
    if (outcome.quote) {
      return outcome.quote;
    }
    lastReason = outcome.reason;
    if (outcome.reason === 'timeout') {
      throw new RequoteError('quote-refresh-timeout', lastReason);
    }
    if (attempt < MAX_REQUOTE_ATTEMPTS) {
      const wait = Math.min(REQUOTE_RETRY_INTERVAL_MS, deadline - deps.now());
      if (wait <= 0) {
        throw new RequoteError('quote-refresh-timeout', lastReason);
      }
      await deps.delay(wait);
    }
  }
  throw new RequoteError('quote-refresh-failed', lastReason);
}
