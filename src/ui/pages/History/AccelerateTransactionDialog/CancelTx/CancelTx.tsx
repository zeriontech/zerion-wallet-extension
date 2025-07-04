import React, { useState, useMemo, useRef, useCallback } from 'react';
import ArrowLeftcon from 'jsx:src/ui/assets/arrow-left.svg';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import EditIcon from 'jsx:src/ui/assets/edit.svg';
import CancelEmojiSrc from 'url:src/ui/assets/cancel-emoji.png';
import CancelEmoji2xSrc from 'url:src/ui/assets/cancel-emoji@2x.png';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  createCancelAddressAction,
  type AnyAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { createChain } from 'src/modules/networks/Chain';
import { focusNode } from 'src/ui/shared/focusNode';
import type { SendTxBtnHandle } from 'src/ui/components/SignTransactionButton';
import { SignTransactionButton } from 'src/ui/components/SignTransactionButton';
import { useMutation } from '@tanstack/react-query';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { invariant } from 'src/shared/invariant';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useEstimateGas } from 'src/modules/ethereum/transactions/useEstimateGas';
import { valueToHex } from 'src/shared/units/valueToHex';
import type {
  IncomingTransactionWithChainId,
  IncomingTransactionWithFrom,
} from 'src/modules/ethereum/types/IncomingTransaction';
import { getError } from 'src/shared/errors/getError';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { wait } from 'src/shared/wait';
import { usePreferences } from 'src/ui/features/preferences';
import { NetworkFee } from '../../../SendTransaction/NetworkFee';
import { useTransactionFee } from '../../../SendTransaction/TransactionConfiguration/useTransactionFee';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../../../SendTransaction/TransactionConfiguration/applyConfiguration';
import { txErrorToMessage } from '../../../SendTransaction/shared/transactionErrorToMessage';
import {
  createCancelTransaction,
  increaseGasPrices,
} from '../shared/accelerate-helpers';

function CancelTxContent({
  wallet,
  addressAction,
  transaction,
  onDismiss,
  onSuccess,
}: {
  wallet: ExternallyOwnedAccount;
  addressAction: AnyAddressAction;
  transaction: IncomingTransactionWithChainId & IncomingTransactionWithFrom;
  onDismiss: () => void;
  onSuccess: () => void;
}) {
  const { address } = wallet;
  const { preferences } = usePreferences();
  const { transaction: originalTransaction } = addressAction;
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const chain = createChain(originalTransaction.chain);
  const { data: chainGasPrices = null } = useGasPrices(chain);
  const acceleratedGasPrices = useMemo(
    () => increaseGasPrices(chainGasPrices),
    [chainGasPrices]
  );

  const feeValueCommonRef = useRef<string>(null); /** for analytics only */
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

  const signTxBtnRef = useRef<SendTxBtnHandle | null>(null);

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
      invariant(signTxBtnRef.current, 'SignTransactionButton not found');
      const tx = applyConfiguration(
        transaction,
        { ...configuration, nonce: String(nonce) },
        acceleratedGasPrices
      );
      const txResponse = await signTxBtnRef.current.sendTransaction({
        transaction: { evm: tx },
        chain: chain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Cancel',
        feeValueCommon,
        addressAction: createCancelAddressAction(addressAction, tx),
      });
      invariant(txResponse.evm?.hash);
      return txResponse.evm?.hash;
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => 'sendTransaction',
    onSuccess: async () => {
      if (preferences?.enableHoldToSignButton) {
        await wait(500);
      }
      onSuccess();
    },
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
          title="Submit a new transaction with a higher fee and the same nonce. This will replace the original one and make it invalid"
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
            src={CancelEmojiSrc}
            srcSet={`${CancelEmojiSrc}, ${CancelEmoji2xSrc} 2x`}
          />
          <UIText kind="headline/h2">Cancel Transaction</UIText>
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
        <VStack gap={8} style={{ textAlign: 'center' }}>
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
              Back
            </Button>
            {preferences ? (
              <SignTransactionButton
                wallet={wallet}
                ref={signTxBtnRef}
                onClick={() => sendTransaction()}
                holdToSign={preferences.enableHoldToSignButton}
              />
            ) : null}
          </div>
        </VStack>
      </VStack>
    </>
  );
}

export function CancelTx({
  wallet,
  addressAction,
  onDismiss,
  onSuccess,
}: {
  wallet: ExternallyOwnedAccount;
  addressAction: AnyAddressAction;
  onDismiss: () => void;
  onSuccess: () => void;
}) {
  const { address } = wallet;
  const { transaction: originalTransaction } = addressAction;
  const { networks } = useNetworks();
  const chain = createChain(originalTransaction.chain);
  const chainId = networks?.getChainId(chain);
  const transaction = useMemo(() => {
    return chainId
      ? createCancelTransaction({
          from: address,
          nonce: originalTransaction.nonce,
          chainId,
        })
      : null;
  }, [address, chainId, originalTransaction.nonce]);
  const { data: gas, isError, error } = useEstimateGas({ transaction });
  const transactionWithGas = useMemo(() => {
    return transaction && gas ? { ...transaction, gas: valueToHex(gas) } : null;
  }, [gas, transaction]);
  if (isError) {
    return (
      <UIText kind="body/regular" color="var(--negative-500)">
        {getError(error).message}
      </UIText>
    );
  }
  if (!transactionWithGas) {
    return (
      <div style={{ padding: 24 }}>
        <VStack gap={8} style={{ placeItems: 'center' }}>
          <CircleSpinner color="var(--primary)" size="24px" />
          <UIText kind="small/regular" color="var(--neutral-600)">
            Estimating gas...
          </UIText>
        </VStack>
      </div>
    );
  }
  return (
    <CancelTxContent
      wallet={wallet}
      transaction={transactionWithGas}
      addressAction={addressAction}
      onDismiss={onDismiss}
      onSuccess={onSuccess}
    />
  );
}
