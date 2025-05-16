import { useMutation } from '@tanstack/react-query';
import React, { useImperativeHandle, useRef } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
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
import type { OneOf } from 'src/shared/type-utils/OneOf';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { SolTransaction } from 'src/modules/solana/SolTransaction';
import { solToBase64 } from 'src/modules/solana/transactions/create';
import { WithReadonlyWarningDialog } from './ReadonlyWarningDialog';

type SendTxParams = TransactionContextParams &
  OneOf<{ transaction: IncomingTransaction; solTransaction: SolTransaction }>;

type SignAllTransactionsParams = TransactionContextParams & {
  transaction: undefined;
  solTransactions: SolTransaction[];
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
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
      isLoading?: boolean;
      holdToSign: boolean | null;
    },
    ref: React.Ref<SendTxBtnHandle>
  ) {
    const hardwareSignRef = useRef<SignTransactionHandle | null>(null);

    const sendTxMutation = useMutation({
      mutationFn: async ({
        transaction,
        solTransaction,
        ...params
      }: SendTxParams): Promise<SignTransactionResult> => {
        if (transaction) {
          // ethereum flow
          if (isDeviceAccount(wallet)) {
            invariant(
              hardwareSignRef.current,
              'HardwareSignTransaction must be mounted'
            );
            const signedTx = await hardwareSignRef.current.signTransaction({
              transaction,
              chain: createChain(params.chain),
              address: wallet.address,
            });
            const result = await walletPort.request('sendSignedTransaction', {
              serialized: signedTx,
              ...params,
            });
            return { evm: result };
          } else {
            const result = await walletPort.request('signAndSendTransaction', [
              transaction,
              params,
            ]);
            return { evm: result };
          }
        } else {
          // solana
          if (isDeviceAccount(wallet)) {
            throw new Error('TODO: Support hardware signing for Solana');
          }
          const methodMap = {
            default: 'solana_signAndSendTransaction',
            signAndSendTransaction: 'solana_signAndSendTransaction',
            signTransaction: 'solana_signTransaction',
          } as const;
          invariant(
            params.method !== 'signAllTransactions',
            'SignTransactionButton: Use dedicated signAllTransactions method'
          );
          const methodName = params.method
            ? methodMap[params.method]
            : methodMap.default;

          const result = await walletPort.request(methodName, {
            transaction: solToBase64(solTransaction),
            params,
          });
          return { solana: result };
        }
      },
    });

    const signAllTransactionsMutation = useMutation({
      mutationFn: async ({
        transaction,
        solTransactions,
        ...params
      }: SignAllTransactionsParams) => {
        if (transaction) {
          throw new Error('Batch signing is supported only for Solana');
        } else {
          if (isDeviceAccount(wallet)) {
            throw new Error('TODO: Support hardware signing for Solana');
          }
          const transactions = solTransactions.map((tx) => solToBase64(tx));
          const result = await walletPort.request(
            'solana_signAllTransactions',
            { transactions, params }
          );
          return { ethereum: undefined, solana: result };
        }
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
