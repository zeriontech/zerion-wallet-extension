import { useMutation } from '@tanstack/react-query';
import React, { useImperativeHandle, useRef } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import { isDeviceAccount } from 'src/shared/types/validators';
import {
  HardwareSignTransaction,
  type SignTransactionHandle,
} from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction';
import { walletPort } from 'src/ui/shared/channels';
import {
  Button,
  HoldableButton,
  type Kind as ButtonKind,
} from 'src/ui/ui-kit/Button';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { WithReadonlyWarningDialog } from './ReadonlyWarningDialog';

type SendTxParams = TransactionContextParams & {
  transaction: MultichainTransaction;
};

type SignAllTransactionsParams = TransactionContextParams & {
  transaction: { solana: StringBase64[] };
};

export interface SendTxBtnHandle {
  sendTransaction(params: SendTxParams): Promise<SignTransactionResult>;
  signAllTransactions(
    params: SignAllTransactionsParams
  ): Promise<SignTransactionResult>;
}

export const SignTransactionButton = React.forwardRef(
  function SignTransactionButton(
    {
      wallet,
      children,
      buttonTitle,
      onClick,
      buttonKind = 'primary',
      isLoading: isLoadingProp,
      disabled: disabledAttr,
      holdToSign,
      bluetoothSupportEnabled,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
      isLoading?: boolean;
      holdToSign: boolean | null;
      bluetoothSupportEnabled: boolean | null;
    },
    ref: React.Ref<SendTxBtnHandle>
  ) {
    const hardwareSignRef = useRef<SignTransactionHandle | null>(null);

    const sendTxMutation = useMutation({
      mutationFn: async ({
        transaction,
        ...txContext
      }: SendTxParams): Promise<SignTransactionResult> => {
        if (transaction.evm) {
          // ethereum flow
          if (isDeviceAccount(wallet)) {
            invariant(
              hardwareSignRef.current,
              'HardwareSignTransaction must be mounted'
            );
            const signedTx = await hardwareSignRef.current.signTransaction({
              transaction: transaction.evm,
              chain: createChain(txContext.chain),
              address: wallet.address,
            });
            const result = await walletPort.request('sendSignedTransaction', {
              serialized: signedTx,
              txContext,
            });
            return { evm: result };
          } else {
            const result = await walletPort.request('signAndSendTransaction', [
              transaction.evm,
              txContext,
            ]);
            return { evm: result };
          }
        } else {
          // solana
          if (isDeviceAccount(wallet)) {
            invariant(
              hardwareSignRef.current,
              'HardwareSignTransaction must be mounted'
            );
            invariant(
              txContext.method !== 'signAllTransactions',
              'SignTransactionButton: signAllTransactions not supported for hardware wallets'
            );
            const signedTx =
              await hardwareSignRef.current.solana_signTransaction({
                transaction: transaction.solana,
                address: wallet.address,
                ...txContext,
              });
            const result = await walletPort.request('solana_sendTransaction', {
              signed: signedTx as StringBase64,
              publicKey: wallet.address,
              params: txContext,
            });
            return { solana: result };
          }

          const methodMap = {
            default: 'solana_signAndSendTransaction',
            signAndSendTransaction: 'solana_signAndSendTransaction',
            signTransaction: 'solana_signTransaction',
          } as const;
          invariant(
            txContext.method !== 'signAllTransactions',
            'SignTransactionButton: Use dedicated signAllTransactions method'
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
      },
    });

    const signAllTransactionsMutation = useMutation({
      mutationFn: async ({
        transaction: { solana },
        ...params
      }: SignAllTransactionsParams) => {
        if (isDeviceAccount(wallet)) {
          throw new Error('TODO: Support hardware signing for Solana');
        }
        const result = await walletPort.request('solana_signAllTransactions', {
          transactions: solana,
          params,
        });
        return { solana: result };
      },
    });

    useImperativeHandle(ref, () => ({
      sendTransaction: sendTxMutation.mutateAsync,
      signAllTransactions: signAllTransactionsMutation.mutateAsync,
    }));

    const activeMutation =
      [sendTxMutation, signAllTransactionsMutation].find(
        (x) => x.status !== 'idle'
      ) || sendTxMutation;
    const isLoading = isLoadingProp || activeMutation.isLoading;
    const isSending = activeMutation.isLoading;

    // there is a small delay after using a holdable button
    // button should be disabled after successful sign to prevent a duplicating call
    const disabled =
      isLoading || (holdToSign && activeMutation.isSuccess) || disabledAttr;
    const title = buttonTitle || 'Confirm';

    return isDeviceAccount(wallet) ? (
      <HardwareSignTransaction
        ref={hardwareSignRef}
        ecosystem={getAddressType(wallet.address)}
        derivationPath={wallet.derivationPath}
        isSending={isSending}
        children={children}
        buttonTitle={
          activeMutation.isSuccess
            ? 'Sent'
            : isLoadingProp
            ? 'Preparing...'
            : buttonTitle
        }
        buttonKind={buttonKind}
        onClick={onClick}
        disabled={disabled}
        bluetoothSupportEnabled={Boolean(bluetoothSupportEnabled)}
        {...buttonProps}
      />
    ) : (
      <WithReadonlyWarningDialog
        address={wallet.address}
        onClick={onClick}
        render={({ handleClick }) => {
          return holdToSign ? (
            <HoldableButton
              text={`Hold to ${title}`}
              successText={
                <HStack gap={4} alignItems="center">
                  <CheckIcon
                    style={{
                      width: 20,
                      height: 20,
                      color: 'var(--positive-500)',
                    }}
                  />
                  <span>Sent</span>
                </HStack>
              }
              submittingText="Sending..."
              onClick={handleClick}
              success={activeMutation.isSuccess}
              submitting={activeMutation.isLoading}
              error={activeMutation.isError}
              disabled={disabled}
              kind={buttonKind}
              {...buttonProps}
            />
          ) : (
            <Button
              disabled={disabled}
              onClick={handleClick}
              kind={buttonKind}
              {...buttonProps}
            >
              {children ||
                (isLoading ? 'Sending...' : buttonTitle || 'Confirm')}
            </Button>
          );
        }}
      />
    );
  }
);
