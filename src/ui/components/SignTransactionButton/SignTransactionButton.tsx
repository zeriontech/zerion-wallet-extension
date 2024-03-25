import { useMutation, useQuery } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import React, { useImperativeHandle, useRef } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { createChain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import {
  isDeviceAccount,
  isReadonlyContainer,
} from 'src/shared/types/validators';
import {
  HardwareSignTransaction,
  type SignHandle,
} from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction';
import { walletPort } from 'src/ui/shared/channels';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { ReadonlyWarningDialog } from './ReadonlyWarningDialog';

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
      onClick,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      wallet: ExternallyOwnedAccount;
      kind?: ButtonKind;
      buttonTitle?: React.ReactNode;
    },
    ref: React.Ref<SignerSenderHandle>
  ) {
    const hardwareSignRef = useRef<SignHandle | null>(null);
    const readonlyWarningDialogRef = useRef<HTMLDialogElementInterface | null>(
      null
    );
    const { address } = wallet;
    const { data: walletGroup } = useQuery({
      queryKey: ['getWalletGroupByAddress', address],
      queryFn: () => getWalletGroupByAddress(address),
      // NOTE: if we use {suspense: true} here (default), SendTransaction view crashes
      // with "max update depth exceeded" ¯\_(ツ)_/¯. Not a good sign, but afaik it should be fixed
      // in the next version of '@tanstack/react-query'
      suspense: false,
    });
    const isReadonlyGroup = walletGroup
      ? isReadonlyContainer(walletGroup.walletContainer)
      : null;
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

    return isDeviceAccount(wallet) ? (
      <HardwareSignTransaction
        ref={hardwareSignRef}
        derivationPath={wallet.derivationPath}
        isSending={sendTxMutation.isLoading}
        children={children}
        buttonTitle={buttonTitle}
        onClick={onClick}
        {...buttonProps}
      />
    ) : (
      <>
        <ReadonlyWarningDialog ref={readonlyWarningDialogRef} />
        <Button
          disabled={sendTxMutation.isLoading}
          onClick={(event) => {
            if (isReadonlyGroup) {
              invariant(readonlyWarningDialogRef.current, 'Dialog not mounted');
              event.preventDefault();
              readonlyWarningDialogRef.current.showModal();
            } else {
              onClick?.(event);
            }
          }}
          {...buttonProps}
        >
          {children ||
            (sendTxMutation.isLoading
              ? 'Sending...'
              : buttonTitle || 'Confirm')}
        </Button>
      </>
    );
  }
);
