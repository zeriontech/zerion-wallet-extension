import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { invariant } from 'src/shared/invariant';
import { signTransactions } from 'src/ui/components/TransactionSigner';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { walletPort } from 'src/ui/shared/channels';
import { createPendingRowEffects } from './broadcastLockStore';
import { dismissPendingAction } from './dismissPendingAction';
import {
  openPendingDismissConfirm,
  openPendingSignReview,
  showPendingActionError,
} from './pendingActionDialogStore';
import { signLock } from './signLock';
import { signPendingAction } from './signPendingAction';

async function getWallet(address: string) {
  const wallet = await walletPort.request('uiGetWalletByAddress', {
    address,
    groupId: null,
  });
  invariant(wallet, `Wallet ${address} is not in this extension`);
  return wallet;
}

/** Sign and Dismiss for History's unsigned rows, one at a time across all rows through `signLock`. */
export function useSignPendingAction({
  onSettled,
}: {
  /** Runs after a broadcast or a dismiss while still mounted, e.g. to refetch History */
  onSettled(): void;
}) {
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const holder = useStore(signLock.store);
  const source = useHttpClientSource();
  const { globalPreferences } = useGlobalPreferences();
  const bluetoothSupportEnabled =
    globalPreferences?.bluetoothSupportEnabled ?? null;
  const effects = useMemo(
    () =>
      createPendingRowEffects(() => {
        if (mountedRef.current) {
          onSettledRef.current();
        }
      }),
    []
  );

  const sign = useCallback(
    async (item: PendingAction) => {
      try {
        await signPendingAction(item, {
          lock: signLock,
          nowMs: Date.now,
          initiator: INTERNAL_ORIGIN,
          buildAction: async (params) => {
            const response = await ZerionAPI.transactionBuildAction(params, {
              source,
            });
            if (!response.data) {
              throw new Error(
                response.errors?.at(0)?.detail ??
                  'Failed to build the transaction'
              );
            }
            return response.data;
          },
          review: openPendingSignReview,
          enqueue: (steps, { signerAddress, signal, onEvent }) => ({
            promise: getWallet(signerAddress).then(
              (wallet) =>
                signTransactions(steps, {
                  wallet,
                  holdToSign: false,
                  bluetoothSupportEnabled,
                  signal,
                  onEvent,
                }).promise
            ),
          }),
          onBroadcast: effects.onBroadcast,
        });
      } catch (error) {
        showPendingActionError("Couldn't sign the transaction", error);
      }
    },
    [source, bluetoothSupportEnabled, effects]
  );

  const dismiss = useCallback(
    async (item: PendingAction) => {
      try {
        const wallet = await getWallet(item.address);
        await dismissPendingAction(item, {
          lock: signLock,
          nowMs: Date.now,
          confirmAndSign: ({ message }, signal) =>
            openPendingDismissConfirm({ item, message, wallet }, signal),
          dismissAction: (params) =>
            ZerionAPI.transactionDismissAction(params, { source }),
          onDismissed: effects.onDismissed,
        });
      } catch (error) {
        showPendingActionError("Couldn't hide the transaction", error);
      }
    },
    [source, effects]
  );

  return { holder, sign, dismiss, cancel: signLock.cancel };
}
