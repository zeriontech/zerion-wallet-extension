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
  type SignHandle,
} from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction';
import { walletPort } from 'src/ui/shared/channels';
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';

type SendTxParams = TransactionContextParams & {
  transaction: IncomingTransaction;
};

export interface SignerSenderHandle {
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
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      kind?: ButtonKind;
      buttonTitle?: React.ReactNode;
    },
    ref: React.Ref<SignerSenderHandle>
  ) {
    const hardwareSignRef = useRef<SignHandle | null>(null);
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
            // chain: params.chain.toString(),
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

    return isDeviceAccount(wallet) ? (
      <HardwareSignTransaction
        ref={hardwareSignRef}
        derivationPath={wallet.derivationPath}
        isSending={sendTxMutation.isLoading}
        children={children}
        buttonTitle={buttonTitle}
        {...buttonProps}
      />
    ) : (
      <Button disabled={sendTxMutation.isLoading} {...buttonProps}>
        {children ||
          (sendTxMutation.isLoading ? 'Sending...' : buttonTitle || 'Confirm')}
      </Button>
    );
  }
);
