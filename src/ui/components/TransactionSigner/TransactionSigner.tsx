import React, { useEffect, useRef, useState } from 'react';
import { isDeviceAccount } from 'src/shared/types/validators';
import { useLedgerIframeController } from 'src/ui/hardware-wallet/useLedgerIframeController';
import { PerpsActivityToaster } from '../PerpsActivity';
import { getQueues, subscribeChange } from './store';
import { TransactionToaster } from './Toaster/TransactionToaster';
import { HardwareDialog } from './HardwareDialog/HardwareDialog';
import { LedgerDialogWrapper } from './LedgerDialogWrapper';
import { runQueue } from './runQueue';
import { runStep } from './runStep';
import { startOrderFollowUps } from './orderFollowUp/followOrders';

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

  // Follow placed orders and wallet-sent swaps outside the queue, until unmount.
  useEffect(() => startOrderFollowUps(), []);

  // Drive the head of the global queue.
  const runningRef = useRef<string | null>(null);
  useEffect(() => {
    function tick() {
      if (runningRef.current) return;
      const head = getQueues()[0];
      if (!head) return;
      if (head.run.state !== 'pending') return;
      runningRef.current = head.queueId;
      void runQueue(head, runStep).finally(() => {
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
