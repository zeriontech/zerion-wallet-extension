import React, { useState, useMemo, useRef, useCallback } from 'react';
import omit from 'lodash/omit';
import { produce } from 'immer';
import ArrowLeftcon from 'jsx:src/ui/assets/arrow-left.svg';
import RocketOutlineIcon from 'jsx:src/ui/assets/rocket-outline.svg';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import EditIcon from 'jsx:src/ui/assets/edit.svg';
import RocketSrc from 'src/ui/assets/rocket.png';
import Rocket2xSrc from 'src/ui/assets/rocket@2x.png';
import CancelEmojiSrc from 'src/ui/assets/cancel-emoji.png';
import CancelEmoji2xSrc from 'src/ui/assets/cancel-emoji@2x.png';
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
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import {
  isLocalAddressAction,
  type AnyAddressAction,
  createAcceleratedAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import { BigNumber } from 'ethers';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { createChain } from 'src/modules/networks/Chain';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { focusNode } from 'src/ui/shared/focusNode';
import type { SignerSenderHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { walletPort } from 'src/ui/shared/channels';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ViewLoadingSuspense } from 'src/ui/components/ViewLoading/ViewLoading';
import { invariant } from 'src/shared/invariant';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { NetworkFee } from '../../SendTransaction/NetworkFee';
import { useTransactionFee } from '../../SendTransaction/TransactionConfiguration/useTransactionFee';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../../SendTransaction/TransactionConfiguration/applyConfiguration';
import { txErrorToMessage } from '../../SendTransaction/shared/transactionErrorToMessage';

function fromAddressActionTransaction(
  transaction: (
    | TransactionObject['transaction']
    | AnyAddressAction['transaction']
  ) & {
    gasLimit?: BigNumber;
    gasPrice?: BigNumber;
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    value?: BigNumber;
  }
) {
  const tx = omit(transaction, [
    'chain',
    'confirmations',
    'fee',
    'status',
    'r',
    's',
    'v',
    'hash',
    'blockNumber',
    'blockHash',
    'timestamp',
    'raw',
    'wait',
  ]);
  for (const untypedKey in tx) {
    const key = untypedKey as keyof typeof tx;
    const value = tx[key];
    if (BigNumber.isBigNumber(value)) {
      // @ts-ignore
      tx[key] = BigNumber.from(value).toHexString();
    }
  }
  return tx as IncomingTransaction;
}

function removeGasPrice(tx: IncomingTransaction) {
  return omit(tx, ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
}

function increase(value: number, multiplier: number) {
  return Math.round(value * multiplier);
}

function speedupGasPrices(
  chainGasPrices: ChainGasPrice | null
): ChainGasPrice | null {
  if (!chainGasPrices) {
    return null;
  }
  return produce(chainGasPrices, (draft) => {
    if (draft.info.classic) {
      const { fast } = draft.info.classic;
      draft.info.classic.fast = increase(fast, 1.1);
    }
    if (draft.info.eip1559?.fast) {
      const { max_fee, priority_fee } = draft.info.eip1559.fast;
      draft.info.eip1559.fast.max_fee = increase(max_fee, 1.1);
      draft.info.eip1559.fast.priority_fee = increase(priority_fee, 1.3);
    }
    if (draft.info.optimistic?.l2) {
      const { l2 } = draft.info.optimistic;
      draft.info.optimistic.l2 = increase(l2, 1.1);
    }
  });
}

function SpeedUp({
  wallet,
  addressAction,
  onDismiss,
}: {
  wallet: ExternallyOwnedAccount;
  addressAction: AnyAddressAction;
  onDismiss: () => void;
}) {
  const { address } = wallet;
  const { transaction: originalTransaction } = addressAction;
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const transaction = useMemo(() => {
    const tx = removeGasPrice(
      fromAddressActionTransaction(originalTransaction)
    );
    return { ...tx, from: address };
  }, [address, originalTransaction]);
  const chain = createChain(originalTransaction.chain);
  const { data: chainGasPrices = null } = useGasPrices(chain);
  const acceleratedGasPrices = useMemo(
    () => speedupGasPrices(chainGasPrices),
    [chainGasPrices]
  );

  const feeValueCommonRef = useRef<string>(); /** for analytics only */
  const handleFeeValueCommonReady = useCallback((value: string) => {
    feeValueCommonRef.current = value;
  }, []);

  const transactionFee = useTransactionFee({
    address,
    transaction,
    chain,
    chainGasPrices: acceleratedGasPrices,
    networkFeeConfiguration: configuration.networkFee,
    onFeeValueCommonReady: handleFeeValueCommonReady,
  });

  const signerSenderRef = useRef<SignerSenderHandle | null>(null);

  const {
    mutate: sendTransaction,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      if (!acceleratedGasPrices) {
        throw new Error('Unknown gas price');
      }
      const feeValueCommon = feeValueCommonRef.current || null;
      const { nonce } = transaction;
      invariant(chain, 'Chain must be defined to sign the tx');
      invariant(nonce, 'Transaction must have a nonce');
      invariant(signerSenderRef.current, 'SignTransactionButton not found');
      const tx = applyConfiguration(
        transaction,
        { ...configuration, nonce: String(nonce) },
        acceleratedGasPrices
      );
      const txResponse = await signerSenderRef.current.sendTransaction({
        transaction: tx,
        chain,
        initiator: INTERNAL_ORIGIN,
        feeValueCommon,
        addressAction: createAcceleratedAddressAction(addressAction, tx),
      });
      return txResponse.hash;
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => 'sendTransaction',
    onSuccess: () => onDismiss(),
  });
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          aria-label="Go back"
          onClick={onDismiss}
          kind="ghost"
          style={{ padding: 4 }}
          size={32}
        >
          <ArrowLeftcon />
        </Button>
        <div
          title="Resubmit the transaction with a 10% higher fee to try to speed up processing"
          style={{ cursor: 'help' }}
        >
          <QuestionHintIcon
            style={{
              display: 'block',
              width: 32,
              height: 32,
              color: 'var(--neutral-500)',
            }}
          />
        </div>
      </div>
      <Spacer height={16} />
      <VStack gap={32}>
        <VStack gap={16} style={{ placeItems: 'center' }}>
          <img
            alt=""
            src={RocketSrc}
            srcSet={`${RocketSrc}, ${Rocket2xSrc} 2x`}
          />
          <UIText kind="headline/h2">Speed Up Transaction</UIText>
          <div
            style={{
              backgroundColor: 'var(--neutral-200)',
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <NetworkFee
              transaction={transaction}
              transactionFee={transactionFee}
              chainGasPrices={acceleratedGasPrices}
              chain={chain}
              networkFeeConfiguration={configuration.networkFee}
              onChange={(networkFee) =>
                setConfiguration((current) => ({ ...current, networkFee }))
              }
              customViewOnly={true}
              label={<UIText kind="body/accent">Network Fee:</UIText>}
              renderDisplayValue={({ hintTitle, displayValue }) => (
                <HStack gap={4} alignItems="center">
                  <UIText kind="body/accent" title={hintTitle}>
                    {displayValue}
                  </UIText>
                  <EditIcon style={{ width: 20, height: 20 }} />
                </HStack>
              )}
            />
          </div>
        </VStack>
        <VStack gap={8}>
          <UIText kind="body/regular" color="var(--negative-500)">
            {isError ? txErrorToMessage(error) : null}
          </UIText>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <Button
              ref={focusNode}
              kind="neutral"
              type="button"
              onClick={onDismiss}
            >
              Cancel
            </Button>
            <SignTransactionButton
              wallet={wallet}
              ref={signerSenderRef}
              onClick={() => sendTransaction()}
            />
          </div>
        </VStack>
      </VStack>
    </>
  );
}

function AccelerateTransactionContent({
  action,
}: {
  action: AnyAddressAction;
}) {
  const [view, setView] = useState<'speedup' | 'cancel' | 'default'>('default');
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });
  if (isLoading || !wallet) {
    return null;
  }
  return view === 'default' ? (
    <>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">{action.type.display_value}</UIText>}
        closeKind="icon"
      />
      <Spacer height={16} />
      <VStack gap={16}>
        <UIText kind="body/regular">{action.transaction.hash}</UIText>
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
                <UIText kind="body/regular">Transaction pending...</UIText>
              </HStack>
              {isLocalAddressAction(action) && action.relatedTransaction ? (
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
      />
    </ViewLoadingSuspense>
  ) : view === 'cancel' ? (
    <>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Button
          aria-label="Go back"
          onClick={() => setView('default')}
          kind="ghost"
          style={{ padding: 4, position: 'absolute', top: -4, left: -8 }}
          size={32}
        >
          <ArrowLeftcon />
        </Button>
        <UIText style={{ placeSelf: 'center' }} kind="body/accent">
          Cancel
        </UIText>
      </div>
      <div>ccaaaacsdlkj cenl</div>
    </>
  ) : null;
}

export const AccelerateTransactionDialog = React.forwardRef<
  HTMLDialogElementInterface,
  { action: AnyAddressAction }
>(({ action }, ref) => {
  return (
    <BottomSheetDialog
      ref={ref}
      height="min-content"
      containerStyle={{ padding: 16, paddingBottom: 24 }}
      renderWhenOpen={() => <AccelerateTransactionContent action={action} />}
    ></BottomSheetDialog>
  );
});
