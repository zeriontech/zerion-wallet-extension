import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import {
  toMultichainTransaction,
  type TransactionMultichainBackend,
} from 'src/shared/types/Quote';
import { QueueAbortError } from 'src/ui/components/TransactionSigner/errors';
import type {
  QueueEvent,
  SignStep,
} from 'src/ui/components/TransactionSigner/types';
import { createLocalActionFromPendingAction } from './createLocalActionFromPendingAction';
import { getPendingActionToasterView } from './getPendingActionToasterView';
import { getPendingStatus } from './getPendingStatus';
import {
  SignLockBusyError,
  SignLockCancelledError,
  untilAborted,
  type SignLock,
} from './signLock';

export class PendingActionNotReadyError extends Error {
  name = 'PendingActionNotReadyError';
  constructor() {
    super('This transaction is not ready to sign yet');
  }
}

export class UnsupportedPendingActionError extends Error {
  name = 'UnsupportedPendingActionError';
  constructor(reason: string) {
    super(`This transaction can't be signed in the extension: ${reason}`);
  }
}

export type BuildActionResult = {
  quoteId: string;
  transaction: TransactionMultichainBackend;
  intent: unknown;
};

export type PendingSignReviewRequest = {
  item: PendingAction;
  transaction: MultichainTransaction;
  chain: string;
  addressAction: LocalAddressAction;
};

export type SignPendingActionResult =
  | { kind: 'broadcast'; hash: string }
  | { kind: 'cancelled' };

export interface SignPendingActionDeps {
  lock: SignLock;
  nowMs(): number;
  initiator: string;
  buildAction(params: { actionId: string }): Promise<BuildActionResult>;
  /** Shows the built transaction; resolves true on Confirm, false on Cancel or close */
  review(
    request: PendingSignReviewRequest,
    signal: AbortSignal
  ): Promise<boolean>;
  enqueue(
    steps: SignStep[],
    options: {
      signerAddress: string;
      signal: AbortSignal;
      onEvent(event: QueueEvent): void;
    }
  ): { promise: Promise<unknown> };
  onBroadcast(item: PendingAction, hash: string): void;
}

function isCancellation(error: unknown) {
  return (
    error instanceof SignLockCancelledError || error instanceof QueueAbortError
  );
}

function waitForBroadcast(
  step: SignStep,
  item: PendingAction,
  signerAddress: string,
  signal: AbortSignal,
  deps: SignPendingActionDeps
): Promise<SignPendingActionResult> {
  return new Promise((resolve, reject) => {
    const { promise } = deps.enqueue([step], {
      signerAddress,
      signal,
      onEvent: (event) => {
        if (event.type === 'step-pending') {
          deps.onBroadcast(item, event.txHash);
          resolve({ kind: 'broadcast', hash: event.txHash });
        } else if (event.type === 'step-error') {
          reject(event.error);
        } else if (event.type === 'queue-aborted') {
          resolve({ kind: 'cancelled' });
        }
      },
    });
    promise.then(
      () => reject(new Error('The transaction was not broadcast')),
      reject
    );
  });
}

/** Builds, reviews and enqueues one ready-to-sign row while holding the sign lock. */
export async function signPendingAction(
  item: PendingAction,
  deps: SignPendingActionDeps
): Promise<SignPendingActionResult> {
  if (getPendingStatus(item, deps.nowMs()).kind !== 'readyToSign') {
    throw new PendingActionNotReadyError();
  }
  const hold = deps.lock.acquire({
    pendingActionId: item.pendingActionId,
    kind: 'sign',
  });
  if (!hold) {
    throw new SignLockBusyError();
  }
  const { signal } = hold;
  try {
    const built = await untilAborted(
      deps.buildAction({ actionId: item.pendingActionId }),
      signal
    );
    if (built.intent != null) {
      throw new UnsupportedPendingActionError('intent actions');
    }
    if (!built.transaction?.evm && !built.transaction?.solana) {
      throw new UnsupportedPendingActionError('no EVM or Solana transaction');
    }
    const chain = item.acts.at(0)?.transaction.chain ?? item.transaction?.chain;
    if (!chain) {
      throw new UnsupportedPendingActionError('unknown chain');
    }
    const transaction = toMultichainTransaction(built.transaction);
    const signerAddress = transaction.evm?.from || item.address;
    const addressAction = createLocalActionFromPendingAction({
      item,
      transaction,
      chain,
    });

    const confirmed = await untilAborted(
      deps.review(
        { item, transaction, chain: chain.id, addressAction },
        signal
      ),
      signal
    );
    if (!confirmed) {
      return { kind: 'cancelled' };
    }

    const step: SignStep = {
      kind: 'send',
      params: {
        transaction,
        chain: chain.id,
        initiator: deps.initiator,
        clientScope: 'History',
        feeValueCommon: null,
        actionType: item.type.displayValue,
        addressAction,
        orderReport: { quoteId: built.quoteId, role: 'step' },
      },
      toaster: getPendingActionToasterView(item),
    };
    return await untilAborted(
      waitForBroadcast(step, item, signerAddress, signal, deps),
      signal
    );
  } catch (error) {
    if (isCancellation(error)) {
      return { kind: 'cancelled' };
    }
    throw error;
  } finally {
    hold.release();
  }
}
