import { useMutation } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import React, { useImperativeHandle, useRef } from 'react';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { Quote } from 'src/shared/types/Quote';
import { isDeviceAccount } from 'src/shared/types/validators';
import {
  HardwareSignTransaction,
  type SignHandle,
} from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction';
import { walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';

interface SendTxParams {
  transaction: IncomingTransaction;
  chain: Chain;
  feeValueCommon: string | null;
  initiator: string;
  addressAction: AnyAddressAction | null;
  quote?: Quote;
}

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
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
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
            chain: params.chain,
            address: wallet.address,
          });
          return walletPort.request('sendSignedTransaction', {
            serialized: signedTx,
            ...params,
            chain: params.chain.toString(),
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
        {...buttonProps}
      />
    ) : (
      <Button disabled={sendTxMutation.isLoading} {...buttonProps}>
        {children || (sendTxMutation.isLoading ? 'Sending...' : 'Confirm')}
      </Button>
    );
  }
);
