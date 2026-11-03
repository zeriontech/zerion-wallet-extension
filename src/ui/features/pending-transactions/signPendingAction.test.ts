import { describe, expect, it } from '@jest/globals';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type {
  QueueEvent,
  SignStep,
} from 'src/ui/components/TransactionSigner/types';
import {
  EVM_ADDRESS,
  EVM_BUILT_TRANSACTION,
  NOW_MS,
  SOLANA_ADDRESS,
  SOLANA_BUILT_TRANSACTION,
  evmBuildResult,
  evmNotReadyRow,
  evmReadyRow,
  solanaBuildResult,
  solanaReadyRow,
} from './signPendingAction.fixtures';
import { mockStoreUnit } from './mockStoreUnit';
import type {
  BuildActionResult,
  SignPendingActionDeps,
} from './signPendingAction';

mockStoreUnit();
const { createSignLock } = await import('./signLock');
const {
  PendingActionNotReadyError,
  UnsupportedPendingActionError,
  signPendingAction,
} = await import('./signPendingAction');

const ORIGIN = 'chrome-extension://extension-id';
const BROADCAST_HASH = `0x${'ab'.repeat(32)}`;

type EnqueueCall = {
  steps: SignStep[];
  signerAddress: string;
};

function createFakeDeps(build: BuildActionResult) {
  const calls: string[] = [];
  const buildCalls: Array<{ actionId: string }> = [];
  const enqueueCalls: EnqueueCall[] = [];
  const lock = createSignLock();
  const deps: SignPendingActionDeps = {
    lock,
    nowMs: () => NOW_MS,
    initiator: ORIGIN,
    buildAction: async (params) => {
      calls.push('buildAction');
      buildCalls.push(params);
      return build;
    },
    review: async () => {
      calls.push('review');
      return true;
    },
    enqueue: (steps, { signerAddress, onEvent }) => {
      calls.push('enqueue');
      enqueueCalls.push({ steps, signerAddress });
      const emit = (event: QueueEvent) => onEvent(event);
      emit({ type: 'step-start', index: 0 });
      emit({ type: 'step-signing', index: 0 });
      emit({ type: 'step-pending', index: 0, txHash: BROADCAST_HASH });
      return { promise: new Promise(() => null) };
    },
    onBroadcast: () => {
      calls.push('onBroadcast');
    },
  };
  return { deps, calls, buildCalls, enqueueCalls, lock };
}

describe('signPendingAction', () => {
  it.each([
    {
      name: 'EVM',
      row: evmReadyRow(),
      build: evmBuildResult(),
      expectedTransaction: {
        evm: expect.objectContaining({
          from: EVM_BUILT_TRANSACTION.from,
          to: EVM_BUILT_TRANSACTION.to,
          data: EVM_BUILT_TRANSACTION.data,
          chainId: '0x2105',
          nonce: 27,
          type: 2,
          gasLimit: '0x3d090',
          maxFeePerGas: '0x5f5e100',
          maxPriorityFeePerGas: '0xf4240',
        }),
      },
      expectedSigner: EVM_ADDRESS,
      expectedChain: 'base',
      expectedQuoteId: 'q-evm-5b1f0c2e',
    },
    {
      name: 'Solana',
      row: solanaReadyRow(),
      build: solanaBuildResult(),
      expectedTransaction: { solana: SOLANA_BUILT_TRANSACTION },
      expectedSigner: SOLANA_ADDRESS,
      expectedChain: 'solana',
      expectedQuoteId: 'q-sol-77c2a9d1',
    },
  ])(
    'builds, reviews, then enqueues one send step for a ready $name row',
    async ({
      row,
      build,
      expectedTransaction,
      expectedSigner,
      expectedChain,
      expectedQuoteId,
    }) => {
      const { deps, calls, buildCalls, enqueueCalls, lock } =
        createFakeDeps(build);

      const result = await signPendingAction(row, deps);

      expect(result).toEqual({ kind: 'broadcast', hash: BROADCAST_HASH });
      expect(calls).toEqual([
        'buildAction',
        'review',
        'enqueue',
        'onBroadcast',
      ]);
      expect(buildCalls).toEqual([{ actionId: row.pendingActionId }]);
      expect(enqueueCalls).toHaveLength(1);
      const [{ steps, signerAddress }] = enqueueCalls;
      expect(signerAddress).toBe(expectedSigner);
      expect(steps).toHaveLength(1);
      const [step] = steps;
      expect(step.kind).toBe('send');
      expect(step.params).toEqual(
        expect.objectContaining({
          transaction: expectedTransaction,
          chain: expectedChain,
          initiator: ORIGIN,
          clientScope: 'History',
          actionType: row.type.displayValue,
          orderReport: { quoteId: expectedQuoteId, role: 'step' },
        })
      );
      expect(step.params.addressAction?.type).toEqual(row.type);
      expect(step.params.addressAction?.type.displayValue).not.toBe('Trade');
      expect(step.params.addressAction?.address).toBe(row.address);
      expect(lock.store.getState()).toBeNull();
    }
  );

  it('shows the review before any signing call and enqueues nothing on Cancel', async () => {
    const { deps, calls, enqueueCalls } = createFakeDeps(evmBuildResult());
    deps.review = async () => {
      calls.push('review');
      return false;
    };

    const result = await signPendingAction(evmReadyRow(), deps);

    expect(result).toEqual({ kind: 'cancelled' });
    expect(calls).toEqual(['buildAction', 'review']);
    expect(enqueueCalls).toHaveLength(0);
  });

  it.each<{
    name: string;
    row: () => PendingAction;
    build: BuildActionResult;
    error: new (...args: never[]) => Error;
  }>([
    {
      name: 'a row that is not readyToSign',
      row: evmNotReadyRow,
      build: evmBuildResult(),
      error: PendingActionNotReadyError,
    },
    {
      name: 'a build-action answer with an intent',
      row: evmReadyRow,
      build: { ...evmBuildResult(), intent: { typedData: {} } },
      error: UnsupportedPendingActionError,
    },
    {
      name: 'a transaction with neither evm nor solana',
      row: evmReadyRow,
      build: {
        ...evmBuildResult(),
        transaction: { evm: null, solana: null },
      },
      error: UnsupportedPendingActionError,
    },
  ])('rejects $name with no enqueue call', async ({ row, build, error }) => {
    const { deps, enqueueCalls, lock } = createFakeDeps(build);

    await expect(signPendingAction(row(), deps)).rejects.toBeInstanceOf(error);

    expect(enqueueCalls).toHaveLength(0);
    expect(lock.store.getState()).toBeNull();
  });
});
