import React, { useState } from 'react';
import RocketOutlineIcon from 'jsx:src/ui/assets/rocket-outline.svg';
import RocketSrc from 'url:src/ui/assets/rocket.png';
import Rocket2xSrc from 'url:src/ui/assets/rocket@2x.png';
import CancelEmojiSrc from 'url:src/ui/assets/cancel-emoji.png';
import CancelEmoji2xSrc from 'url:src/ui/assets/cancel-emoji@2x.png';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import {
  DialogButtonValue,
  DialogTitle,
} from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  isLocalAddressAction,
  type AnyAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { walletPort } from 'src/ui/shared/channels';
import { useQuery } from '@tanstack/react-query';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { ExplorerInfo } from '../ActionDetailedView/components/ExplorerInfo';
import { SpeedUp } from './SpeedUp';
import { CancelTx } from './CancelTx';
import { isCancelTx } from './shared/accelerate-helpers';

function AccelerateTransactionContent({
  action,
  onDismiss,
}: {
  action: AnyAddressAction;
  onDismiss: () => void;
}) {
  const [view, setView] = useState<'speedup' | 'cancel' | 'default'>('default');
  const { networks } = useNetworks();
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  if (isLoading || !wallet) {
    return null;
  }
  const isAccelerated =
    isLocalAddressAction(action) && action.relatedTransaction;
  const isCancel = isCancelTx(action);
  return view === 'default' ? (
    <>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">{action.type.display_value}</UIText>}
        closeKind="icon"
      />
      <Spacer height={16} />
      <VStack gap={16}>
        <div
          style={{
            borderRadius: 12,
            border: '2px solid var(--neutral-200)',
            padding: 16,
          }}
        >
          <VStack gap={16}>
            <HStack gap={8} justifyContent="space-between">
              <HStack gap={8} alignItems="center">
                <CircleSpinner />
                <UIText kind="body/regular">
                  {isCancel
                    ? 'Transaction cancelling...'
                    : 'Transaction pending...'}
                </UIText>
              </HStack>
              {isAccelerated && !isCancel ? (
                <HStack gap={8}>
                  <UIText kind="body/regular" color="var(--neutral-600)">
                    Accelerated
                  </UIText>
                  <RocketOutlineIcon
                    style={{
                      color: 'var(--neutral-500)',
                      width: 24,
                      height: 24,
                    }}
                  />
                </HStack>
              ) : null}
            </HStack>
            <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Button kind="neutral" onClick={() => setView('speedup')}>
                <HStack gap={8} justifyContent="center">
                  <img
                    alt=""
                    style={{ width: 20, height: 20 }}
                    src={RocketSrc}
                    srcSet={`${RocketSrc}, ${Rocket2xSrc} 2x`}
                  />
                  Speed Up
                </HStack>
              </Button>
              <Button kind="neutral" onClick={() => setView('cancel')}>
                <HStack gap={8} justifyContent="center">
                  <img
                    alt=""
                    style={{ width: 20, height: 20 }}
                    src={RocketSrc}
                    srcSet={`${CancelEmojiSrc}, ${CancelEmoji2xSrc} 2x`}
                  />
                  Cancel
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </div>
        {networks ? (
          <div style={{ paddingInline: 16 }}>
            <ExplorerInfo action={action} networks={networks} />
          </div>
        ) : null}
        <form
          method="dialog"
          style={{ marginTop: 16 }}
          onSubmit={(event) => event.stopPropagation()}
        >
          <Button
            kind="primary"
            style={{ width: '100%' }}
            value={DialogButtonValue.cancel}
          >
            Close
          </Button>
        </form>
      </VStack>
    </>
  ) : view === 'speedup' ? (
    <ViewLoadingSuspense>
      <SpeedUp
        wallet={wallet}
        addressAction={action}
        onDismiss={() => setView('default')}
        onSuccess={onDismiss}
      />
    </ViewLoadingSuspense>
  ) : view === 'cancel' ? (
    <ViewLoadingSuspense>
      <CancelTx
        wallet={wallet}
        addressAction={action}
        onDismiss={() => setView('default')}
        onSuccess={onDismiss}
      />
    </ViewLoadingSuspense>
  ) : null;
}

export const AccelerateTransactionDialog = React.forwardRef<
  HTMLDialogElementInterface,
  { action: AnyAddressAction; onDismiss: () => void }
>(({ action, onDismiss }, ref) => {
  return (
    <BottomSheetDialog
      ref={ref}
      height="min-content"
      containerStyle={{ padding: 16, paddingBottom: 24 }}
      renderWhenOpen={() => (
        <AccelerateTransactionContent action={action} onDismiss={onDismiss} />
      )}
    ></BottomSheetDialog>
  );
});
