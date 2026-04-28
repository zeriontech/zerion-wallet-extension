import { useEffect, useRef, useState } from 'react';
import { walletPort } from 'src/ui/shared/channels';
import { invariant } from 'src/shared/invariant';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { QueueAbortError, QueueError, ReadonlyWalletError } from './errors';
import { isReadonlyWallet } from './signTransactions';
import {
  claimSingletonMount,
  emitQueueEvent,
  getQueues,
  removeQueue,
  subscribeChange,
  updateQueueRun,
  type QueueRecord,
} from './store';
import type {
  SendTxParams,
  SignAllTransactionsParams,
  SignStep,
} from './types';

async function signSendStep({
  params: { transaction, ...txContext },
}: {
  params: SendTxParams;
}): Promise<SignTransactionResult> {
  // EVM and Solana software-wallet paths copied from
  // src/ui/components/SignTransactionButton/SignTransactionButton.tsx
  // (hardware-wallet branches intentionally omitted — see scope notes).
  if (transaction.evm) {
    const result = await walletPort.request('signAndSendTransaction', [
      transaction.evm,
      txContext,
    ]);
    return { evm: result };
  }
  const methodMap = {
    default: 'solana_signAndSendTransaction',
    signAndSendTransaction: 'solana_signAndSendTransaction',
    signTransaction: 'solana_signTransaction',
  } as const;
  invariant(
    txContext.method !== 'signAllTransactions',
    'TransactionSigner: Use kind: "signAll" for signAllTransactions'
  );
  const methodName = txContext.method
    ? methodMap[txContext.method]
    : methodMap.default;
  const result = await walletPort.request(methodName, {
    transaction: transaction.solana,
    params: txContext,
  });
  return { solana: result };
}

async function signAllStep({
  params: {
    transaction: { solana },
    ...params
  },
}: {
  params: SignAllTransactionsParams;
}): Promise<SignTransactionResult> {
  const result = await walletPort.request('solana_signAllTransactions', {
    transactions: solana,
    params,
  });
  return { solana: result };
}

async function runStep(step: SignStep): Promise<SignTransactionResult> {
  if (step.kind === 'send') return signSendStep({ params: step.params });
  return signAllStep({ params: step.params });
}

async function runQueue(queue: QueueRecord): Promise<void> {
  const { queueId, steps, options, resolve, reject } = queue;
  const completed: SignTransactionResult[] = [];

  // Pre-flight: readonly check. If readonly, the queue is silently dropped
  // from the global line and the promise rejects. The dialog itself is
  // surfaced by the rendered <TransactionSigner /> reacting to the same
  // pre-flight check elsewhere (TODO: prompt-UI host).
  try {
    const readonly = await isReadonlyWallet(options.wallet.address);
    if (readonly) {
      reject(new ReadonlyWalletError(options.wallet.address));
      removeQueue(queueId);
      return;
    }
  } catch (error) {
    reject(error instanceof Error ? error : new Error(String(error)));
    removeQueue(queueId);
    return;
  }

  if (options.signal?.aborted) {
    reject(new QueueAbortError(0, completed));
    removeQueue(queueId);
    return;
  }

  for (let index = 0; index < steps.length; index++) {
    if (options.signal?.aborted) {
      updateQueueRun(queueId, { state: 'aborted', abortedAt: index });
      emitQueueEvent(queueId, {
        type: 'queue-aborted',
        reason: 'user-dismissed',
        index,
      });
      reject(new QueueAbortError(index, completed));
      removeQueue(queueId);
      return;
    }

    updateQueueRun(queueId, { state: 'running', currentStep: index });
    emitQueueEvent(queueId, { type: 'step-start', index });

    try {
      const result = await runStep(steps[index]);
      completed.push(result);
      emitQueueEvent(queueId, { type: 'step-success', index, result });
    } catch (rawError) {
      const error =
        rawError instanceof Error ? rawError : new Error(String(rawError));
      updateQueueRun(queueId, { state: 'error', failedAt: index, error });
      emitQueueEvent(queueId, { type: 'step-error', index, error });
      reject(new QueueError(index, completed, error));
      removeQueue(queueId);
      return;
    }
  }

  updateQueueRun(queueId, { state: 'done', results: completed });
  emitQueueEvent(queueId, { type: 'queue-done', results: completed });
  resolve(completed);
  removeQueue(queueId);
}

export function TransactionSigner() {
  const releaseRef = useRef<(() => void) | null>(null);
  if (releaseRef.current === null) {
    releaseRef.current = claimSingletonMount();
  }

  // Force-rerender surface so the prompt-UI host (TODO) reacts to queue
  // changes. The runner itself is driven imperatively, not via React state.
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribeChange(() => setTick((n) => n + 1));
  }, []);

  useEffect(() => {
    return () => {
      releaseRef.current?.();
      releaseRef.current = null;
    };
  }, []);

  // Drive the head of the global queue. Single in-flight runner; when the
  // current queue finishes, the next one is picked up on the next 'change'.
  const runningRef = useRef<string | null>(null);
  useEffect(() => {
    function tick() {
      if (runningRef.current) return;
      const head = getQueues()[0];
      if (!head) return;
      if (head.run.state !== 'pending') return;
      runningRef.current = head.queueId;
      void runQueue(head).finally(() => {
        runningRef.current = null;
      });
    }
    tick();
    return subscribeChange(tick);
  }, []);

  // TODO: prompt-UI host.
  // - readonly informational dialog (when isReadonlyWallet for a queue's wallet)
  // - hold-to-sign button (when options.holdToSign and step requires user gesture)
  // - keyboard shortcut bindings
  // All to be rendered as fixed-positioned dialogs above app content.
  return null;
}

// Used as the type-only export to assert that an unsigned, ignored value of
// `StringBase64` is referenced (keeps strict imports happy in skeleton form).
export type _StringBase64 = StringBase64;
