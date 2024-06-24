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
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';
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
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
      isLoading?: boolean;
    },
    ref: React.Ref<SendTxBtnHandle>
  ) {
    const hardwareSignRef = useRef<SignTransactionHandle | null>(null);
    const { mutateAsync: sendTransaction, ...sendTxMutation } = useMutation({
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
    useImperativeHandle(ref, () => ({ sendTransaction }));

    const isLoading = isLoadingProp || sendTxMutation.isLoading;
    const isSending = sendTxMutation.isLoading;
    const disabled = isLoading || disabledAttr;

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
        render={({ handleClick }) => (
          <Button
            disabled={disabled}
            onClick={handleClick}
            kind={buttonKind}
            {...buttonProps}
          >
            {children || (isLoading ? 'Sending...' : buttonTitle || 'Confirm')}
          </Button>
        )}
      />
    );
  }
);
