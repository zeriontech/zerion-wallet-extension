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
import type { SubmittedTransactionResponse } from 'src/shared/types/SubmittedTransactionResponse';
import type { SolTransaction } from 'src/modules/solana/SolTransaction';
import { solToBase64 } from 'src/modules/solana/transactions/create';
import { WithReadonlyWarningDialog } from './ReadonlyWarningDialog';

type SendTxParams = TransactionContextParams &
  OneOf<{ transaction: IncomingTransaction; solTransaction: SolTransaction }>;

export interface SendTxBtnHandle {
  sendTransaction(params: SendTxParams): Promise<SubmittedTransactionResponse>;
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
    const { mutateAsync: sendTransaction, ...sendTxMutation } = useMutation({
      mutationFn: async ({
        transaction,
        solTransaction,
        ...params
      }: SendTxParams) => {
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
            return { ethereum: result };
          } else {
            const result = await walletPort.request('signAndSendTransaction', [
              transaction,
              params,
            ]);
            return { ethereum: result };
          }
        } else {
          // solana
          const methodMap = {
            default: 'solana_signAndSendTransaction',
            signAndSendTransaction: 'solana_signAndSendTransaction',
            signTransaction: 'solana_signTransaction',
            signAllTransactions: 'solana_signAllTransactions',
          } as const;
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

    useImperativeHandle(ref, () => ({ sendTransaction }));

    const isLoading = isLoadingProp || sendTxMutation.isLoading;
    const isSending = sendTxMutation.isLoading;

    // there is a small delay after using a holdable button
    // button should be disabled after successful sign to prevent a duplicating call
    const disabled =
      isLoading || (holdToSign && sendTxMutation.isSuccess) || disabledAttr;
    const title = buttonTitle || 'Confirm';

    return isDeviceAccount(wallet) ? (
      <HardwareSignTransaction
        ref={hardwareSignRef}
        derivationPath={wallet.derivationPath}
        isSending={isSending}
        children={children}
        buttonTitle={
          sendTxMutation.isSuccess
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
              success={sendTxMutation.isSuccess}
              submitting={sendTxMutation.isLoading}
              error={sendTxMutation.isError}
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
