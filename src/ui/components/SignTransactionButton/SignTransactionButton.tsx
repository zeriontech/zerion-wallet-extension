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
import { usePreferences } from 'src/ui/features/preferences';
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
      isLoading: isLoadingProp,
      disabled: disabledAttr,
      holdToSignAllowed,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
      isLoading?: boolean;
      holdToSignAllowed: boolean;
    },
    ref: React.Ref<SendTxBtnHandle>
  ) {
    const { preferences } = usePreferences();
    const holdToSign = holdToSignAllowed && preferences?.enableHoldToSignButton;
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

    const isLoading = isLoadingProp || sendTxMutation.isLoading;
    const isSending = sendTxMutation.isLoading;
    const disabled = isLoading || disabledAttr;
    const title = buttonTitle || 'Confirm';

    return isDeviceAccount(wallet) ? (
      <HardwareSignTransaction
        ref={hardwareSignRef}
        derivationPath={wallet.derivationPath}
        isSending={isSending}
        children={children}
        buttonTitle={isLoadingProp ? 'Preparing...' : buttonTitle}
        buttonKind={buttonKind}
        onClick={onClick}
        disabled={disabledAttr}
        {...buttonProps}
      />
    ) : (
      <WithReadonlyWarningDialog
        address={wallet.address}
        onClick={onClick}
        render={({ handleClick }) => {
          if (!preferences) {
            return null;
          }
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
              success={sendTxMutationInner.isSuccess}
              submitting={sendTxMutationInner.isLoading}
              error={sendTxMutationInner.isError}
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
