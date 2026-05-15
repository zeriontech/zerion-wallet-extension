import React, { useEffect, useRef, useState } from 'react';
import { getError } from 'get-error';
import { walletPort } from 'src/ui/shared/channels';
import { invariant } from 'src/shared/invariant';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { waitForTransactionResolve } from 'src/ui/transactions/useLocalTransactionStatus';
import { isDeviceAccount } from 'src/shared/types/validators';
import { getAddressType } from 'src/shared/wallet/classifiers';
import {
  deniedByUser,
  parseLedgerError,
} from '@zeriontech/hardware-wallet-connection';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import {
  signRegularOrPaymasterTx,
  signSolanaTransaction,
} from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction/HardwareSignTransaction';
import { hardwareMessageHandler } from 'src/ui/pages/HardwareWalletConnection/shared/messageHandler';
import {
  useLedgerIframeController,
  getLedgerIframeController,
  postLedgerSignParams,
} from 'src/ui/hardware-wallet/useLedgerIframeController';
import { PerpsActivityToaster } from '../PerpsActivity';
import {
  QueueAbortError,
  QueueError,
  ReadonlyWalletError,
  TransactionFailedOnChainError,
} from './errors';
import { isReadonlyWallet } from './signTransactions';
import {
  emitQueueEvent,
  getQueues,
  removeQueue,
  subscribeChange,
  updateQueueRun,
  type QueueRecord,
} from './store';
import { TransactionToaster } from './Toaster/TransactionToaster';
import { HardwareDialog } from './HardwareDialog/HardwareDialog';
import { LedgerDialogWrapper } from './LedgerDialogWrapper';
import { isStepStale, refreshStaleGasForStep } from './refreshStaleGas';
import type { SendTxParams, SignStep } from './types';

async function signSendStepSoftware({
  params: { transaction, ...txContext },
}: {
  params: SendTxParams;
}): Promise<SignTransactionResult> {
  // EVM and Solana software-wallet paths copied from
  // src/ui/components/SignTransactionButton/SignTransactionButton.tsx
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

async function signSendStepHardware({
  queue,
  params: { transaction, ...txContext },
}: {
  queue: QueueRecord;
  params: SendTxParams;
}): Promise<SignTransactionResult> {
  const wallet = queue.options.wallet;
  invariant(
    isDeviceAccount(wallet),
    'signSendStepHardware: wallet must be a DeviceAccount'
  );

  if (transaction.evm) {
    const controller = getLedgerIframeController();
    invariant(controller, 'Ledger iframe controller not mounted');
    const contentWindow = controller.getContentWindow();
    invariant(contentWindow, 'Ledger iframe contentWindow not available');
    const signed = await signRegularOrPaymasterTx({
      transaction: transaction.evm,
      messageHandler: hardwareMessageHandler,
      derivationPath: wallet.derivationPath,
      contentWindow,
    });
    const result = await walletPort.request('sendSignedTransaction', {
      serialized: signed.serialized,
      txContext,
    });
    return { evm: result };
  }

  invariant(
    txContext.method !== 'signAllTransactions',
    'TransactionSigner: signAllTransactions is not supported for hardware wallets'
  );
  const controller = getLedgerIframeController();
  invariant(controller, 'Ledger iframe controller not mounted');
  const contentWindow = controller.getContentWindow();
  invariant(contentWindow, 'Ledger iframe contentWindow not available');
  const signed = await signSolanaTransaction({
    transaction: transaction.solana,
    messageHandler: hardwareMessageHandler,
    derivationPath: wallet.derivationPath,
    contentWindow,
  });
  const result = await walletPort.request('solana_sendTransaction', {
    signed: signed as StringBase64,
    publicKey: wallet.address,
    params: txContext,
  });
  return { solana: result };
}

async function runStep({
  queue,
  step,
  index,
}: {
  queue: QueueRecord;
  step: SignStep;
  index: number;
}): Promise<SignTransactionResult> {
  const isHardware = isDeviceAccount(queue.options.wallet);

  emitQueueEvent(queue.queueId, { type: 'step-signing', index });

  let result: SignTransactionResult | null = null;
  if (step.kind === 'send') {
    result = isHardware
      ? await signSendStepHardware({ queue, params: step.params })
      : await signSendStepSoftware({ params: step.params });
  }
  invariant(result, 'Step result is unexpectedly null');

  const txHash =
    result.evm?.hash ||
    (Array.isArray(result.solana)
      ? result.solana[0].signature
      : result.solana?.signature);
  if (txHash) {
    emitQueueEvent(queue.queueId, {
      type: 'step-pending',
      index,
      txHash,
    });
    const status = await waitForTransactionResolve(txHash);
    if (status === 'failed' || status === 'dropped') {
      throw new TransactionFailedOnChainError(status, txHash);
    }
  }
  return result;
}

function isAbortLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true;
  // Ledger-denied is treated as user-dismissed
  try {
    const parsed = parseLedgerError(error);
    if (deniedByUser(parsed)) return true;
  } catch {
    // not a ledger error
  }
  return false;
}

async function runQueue(queue: QueueRecord): Promise<void> {
  const { queueId, steps, options, abortController, resolve, reject } = queue;
  const completed: SignTransactionResult[] = [];

  // For hardware queues, push ecosystem (and bluetooth, in case the hook
  // hasn't pushed yet) into the iframe before the first sign call. All steps
  // in a queue share an ecosystem.
  if (isDeviceAccount(options.wallet)) {
    postLedgerSignParams({
      ecosystem: getAddressType(options.wallet.address),
    });
  }

  // Pre-flight: readonly check.
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

  if (abortController.signal.aborted) {
    emitQueueEvent(queueId, {
      type: 'queue-aborted',
      reason: 'user-dismissed',
      index: 0,
    });
    reject(new QueueAbortError(0, completed));
    removeQueue(queueId);
    return;
  }

  for (let index = 0; index < steps.length; index++) {
    if (abortController.signal.aborted) {
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

    // If the queue sat long enough that the original gas estimate may be
    // stale (e.g. hardware-wallet confirmation took >1min), re-estimate
    // gasLimit before sending. Mutate in place so later iterations see the
    // updated step.
    if (isStepStale(queue.enqueuedAt)) {
      steps[index] = await refreshStaleGasForStep(steps[index]);
    }

    try {
      const result = await runStep({ queue, step: steps[index], index });
      completed.push(result);
      emitQueueEvent(queueId, { type: 'step-success', index, result });
    } catch (rawError) {
      // Normalize via getError so JSON-RPC rejections (plain { code, message,
      // data } objects) keep their message instead of stringifying to
      // "[object Object]".
      const error = getError(rawError);

      // User cancelled (abort signal already set, or Ledger denied) — emit
      // queue-aborted, not step-error.
      if (abortController.signal.aborted || isAbortLikeError(error)) {
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

  // Force-rerender surface so the prompt-UI host (TODO) reacts to queue
  // changes.
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribeChange(() => {
      const snapshot = getQueues().map((q) => ({
        queueId: q.queueId,
        steps: q.steps.length,
        run: q.run,
        wallet: q.options.wallet.address,
        isHardware: isDeviceAccount(q.options.wallet),
      }));
      // eslint-disable-next-line no-console
      console.log('[TransactionSigner] queues', snapshot);
      setTick((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    return () => {
      releaseRef.current?.();
      releaseRef.current = null;
    };
  }, []);

  // Drive the head of the global queue.
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
        // runQueue calls removeQueue synchronously before returning, which
        // emits 'change' while runningRef is still set — so the change-driven
        // tick is a no-op. Re-tick here to pick up the next pending head;
        // otherwise queued-up transactions sit pending forever.
        tick();
      });
    }
    tick();
    return subscribeChange(tick);
  }, []);

  // Troubleshooting dialog — opens on `notConnected` / `interactionRequested`
  // from the iframe; closes on `success` / `resume` / `error` / `cancel`.
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const { iframeRef } = useLedgerIframeController({
    onShowTroubleshooting: () => setLedgerDialogOpen(true),
    onHideTroubleshooting: () => setLedgerDialogOpen(false),
  });

  return (
    <>
      <TransactionToaster />
      <PerpsActivityToaster />
      <HardwareDialog ledgerDialogOpen={ledgerDialogOpen} />
      <LedgerDialogWrapper
        ref={iframeRef}
        open={ledgerDialogOpen}
        onClose={() => setLedgerDialogOpen(false)}
      />
    </>
  );
}
