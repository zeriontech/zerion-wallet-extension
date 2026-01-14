import React, { useState, useMemo, useRef, useCallback } from 'react';
import ArrowLeftcon from 'jsx:src/ui/assets/arrow-left.svg';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import EditIcon from 'jsx:src/ui/assets/edit.svg';
import RocketSrc from 'url:src/ui/assets/rocket.png';
import Rocket2xSrc from 'url:src/ui/assets/rocket@2x.png';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { createAcceleratedAddressAction } from 'src/modules/ethereum/transactions/addressAction';
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
import { usePreferences } from 'src/ui/features/preferences';
import { wait } from 'src/shared/wait';
import { assertProp } from 'src/shared/assert-property';
import { ErrorMessage } from 'src/ui/shared/error-display/ErrorMessage';
import { getError } from 'get-error';
import { getHardwareError } from '@zeriontech/hardware-wallet-connection';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { NetworkFee } from '../../../SendTransaction/NetworkFee';
import { useTransactionFee } from '../../../SendTransaction/TransactionConfiguration/useTransactionFee';
import {
  DEFAULT_CONFIGURATION,
  applyConfiguration,
} from '../../../SendTransaction/TransactionConfiguration/applyConfiguration';
import {
  fromAddressActionTransaction,
  removeGasPrice,
  increaseGasPrices,
} from '../shared/accelerate-helpers';

export function SpeedUp({
  wallet,
  addressAction,
  onDismiss,
  onSuccess,
}: {
  wallet: ExternallyOwnedAccount;
  addressAction: LocalAddressAction;
  onDismiss: () => void;
  onSuccess: () => void;
}) {
  const { address } = wallet;
  const { preferences } = usePreferences();
  const { globalPreferences } = useGlobalPreferences();
  const { rawTransaction: originalTransaction } = addressAction;
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  invariant(originalTransaction, 'Original transaction must be defined');
  const transaction = useMemo(() => {
    const tx = removeGasPrice(
      fromAddressActionTransaction(originalTransaction)
    );
    return { ...tx, from: address };
  }, [address, originalTransaction]);
  const chain = createChain(originalTransaction.chain);
  const { data: chainGasPrices = null } = useGasPrices(chain);
  const acceleratedGasPrices = useMemo(
    () => increaseGasPrices(chainGasPrices),
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
    keepPreviousData: true,
  });

  const signTxBtnRef = useRef<SendTxBtnHandle | null>(null);

  const {
    mutate: sendTransaction,
    isError,
    error,
  } = useMutation({
    mutationFn: async (): Promise<string> => {
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
      assertProp(tx, 'chainId');
      const txResponse = await signTxBtnRef.current.sendTransaction({
        transaction: { evm: tx },
        chain: chain.toString(),
        initiator: INTERNAL_ORIGIN,
        clientScope: 'Speed Up',
        feeValueCommon,
        addressAction: createAcceleratedAddressAction(addressAction, tx),
      });
      invariant(txResponse.evm?.hash);
      return txResponse.evm.hash;
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
        <VStack gap={8} style={{ textAlign: 'center' }}>
          {isError ? (
            <ErrorMessage
              error={getError(error)}
              hardwareError={getHardwareError(error)}
            />
          ) : null}
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
            {preferences && globalPreferences ? (
              <SignTransactionButton
                wallet={wallet}
                ref={signTxBtnRef}
                onClick={() => sendTransaction()}
                holdToSign={preferences.enableHoldToSignButton}
                bluetoothSupportEnabled={
                  globalPreferences.bluetoothSupportEnabled
                }
              />
            ) : null}
          </div>
        </VStack>
      </VStack>
    </>
  );
}
