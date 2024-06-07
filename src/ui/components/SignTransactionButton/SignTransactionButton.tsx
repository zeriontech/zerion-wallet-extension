import { useMutation } from '@tanstack/react-query';
import type { ethers } from 'ethers';
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
import { wait } from 'src/shared/wait';
import { WithReadonlyWarningDialog } from './ReadonlyWarningDialog';

type SendTxParams = TransactionContextParams & {
  transaction: IncomingTransaction;
};

export interface SendTxBtnHandle {
  sendTransaction(
    params: SendTxParams
  ): Promise<ethers.providers.TransactionResponse>;
}

export const SignTransactionButton = React.forwardRef(
  function SignTransactionButton(
    {
      wallet,
      children,
      buttonTitle,
      onClick,
      buttonKind = 'primary',
      holdToSign,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
      holdToSign: boolean | null;
    },
    ref: React.Ref<SendTxBtnHandle>
  ) {
    const hardwareSignRef = useRef<SignTransactionHandle | null>(null);
    const { mutateAsync: sendTransactionInner, ...sendTxMutationInner } =
      useMutation({
        mutationFn: async ({ transaction, ...params }: SendTxParams) => {
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
            return walletPort.request('sendSignedTransaction', {
              serialized: signedTx,
              ...params,
            });
          } else {
            return await walletPort.request('signAndSendTransaction', [
              transaction,
              params,
            ]);
          }
        },
      });

    const { mutateAsync: sendTransaction, ...sendTxMutation } = useMutation({
      mutationFn: async (params: SendTxParams) => {
        const result = await sendTransactionInner(params);
        if (!isDeviceAccount(wallet) && holdToSign) {
          await wait(500);
        }
        return result;
      },
    });
    useImperativeHandle(ref, () => ({ sendTransaction }));

    const title = buttonTitle || 'Confirm';

    return isDeviceAccount(wallet) ? (
      <HardwareSignTransaction
        ref={hardwareSignRef}
        derivationPath={wallet.derivationPath}
        isSending={sendTxMutation.isLoading}
        children={children}
        buttonTitle={buttonTitle}
        buttonKind={buttonKind}
        onClick={onClick}
        {...buttonProps}
      />
    ) : (
      <WithReadonlyWarningDialog
        address={wallet.address}
        onClick={onClick}
        render={({ handleClick }) =>
          holdToSign ? (
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
              success={sendTxMutationInner.isSuccess}
              submitting={sendTxMutationInner.isLoading}
              error={sendTxMutationInner.isError}
              disabled={sendTxMutation.isLoading}
              kind={buttonKind}
              {...buttonProps}
            />
          ) : (
            <Button
              disabled={sendTxMutation.isLoading}
              onClick={handleClick}
              kind={buttonKind}
              {...buttonProps}
            >
              {children || (sendTxMutation.isLoading ? 'Sending...' : title)}
            </Button>
          )
        }
      />
    );
  }
);
