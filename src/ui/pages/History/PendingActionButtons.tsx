import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getPendingRowActions } from 'src/ui/features/pending-transactions/getPendingRowActions';
import { useSignPendingAction } from 'src/ui/features/pending-transactions/useSignPendingAction';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { Button } from 'src/ui/ui-kit/Button';
import type { Size } from 'src/ui/ui-kit/Button/Button';
import { HStack } from 'src/ui/ui-kit/HStack';

/** Sign (row and ActionInfo) and Dismiss (ActionInfo) for an unsigned row of an own wallet; the row holding the sign lock shows Cancel. */
export function PendingActionButtons({
  item,
  nowMs,
  placement,
  onSettled,
}: {
  item: PendingAction;
  nowMs: number;
  placement: 'row' | 'actionInfo';
  onSettled(): void;
}) {
  const { data: walletGroup } = useQuery({
    queryKey: ['getWalletGroupByAddress', item.address],
    queryFn: () => getWalletGroupByAddress(item.address),
    suspense: false,
    useErrorBoundary: false,
  });
  const { holder, sign, dismiss, cancel } = useSignPendingAction({
    onSettled,
  });
  const actions = getPendingRowActions(
    item,
    walletGroup?.walletContainer,
    nowMs
  );
  const showSign = placement === 'row' ? actions.rowSign : actions.infoSign;
  const showDismiss = placement === 'actionInfo' && actions.infoDismiss;
  if (!showSign && !showDismiss) {
    return null;
  }
  const size: Size = placement === 'row' ? 32 : 44;
  if (holder?.pendingActionId === item.pendingActionId) {
    return (
      <Button kind="regular" size={size} onClick={cancel}>
        Cancel
      </Button>
    );
  }
  const busy = holder != null;
  return (
    <HStack
      gap={8}
      style={
        placement === 'actionInfo'
          ? { gridTemplateColumns: showSign && showDismiss ? '1fr 1fr' : '1fr' }
          : undefined
      }
    >
      {showDismiss ? (
        <Button
          kind="regular"
          size={size}
          disabled={busy}
          onClick={() => dismiss(item)}
        >
          Dismiss
        </Button>
      ) : null}
      {showSign ? (
        <Button
          kind="primary"
          size={size}
          disabled={busy}
          onClick={() => sign(item)}
        >
          Sign
        </Button>
      ) : null}
    </HStack>
  );
}
