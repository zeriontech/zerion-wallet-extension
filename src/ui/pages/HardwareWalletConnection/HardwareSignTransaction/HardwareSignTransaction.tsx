import React, { useImperativeHandle, useRef } from 'react';
import { ethers } from 'ethers';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { useLocation, useNavigate } from 'react-router-dom';
import { getError } from 'src/shared/errors/getError';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { nanoid } from 'nanoid';
import type { SignTransactionResult } from 'src/ui/hardware-wallet/types';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { HStack } from 'src/ui/ui-kit/HStack';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import type { Chain } from 'src/modules/networks/Chain';
import { Networks } from 'src/modules/networks/Networks';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { TextPulse } from 'src/ui/components/TextPulse';
import {
  createTypedData,
  serializePaymasterTx,
} from 'src/modules/ethereum/account-abstraction/createTypedData';
import omit from 'lodash/omit';
import { hardwareMessageHandler } from '../shared/messageHandler';

async function signRegularOrPaymasterTx({
  messageHandler,
  transaction: incomingTx,
  derivationPath,
  contentWindow,
}: {
  messageHandler: typeof hardwareMessageHandler;
  transaction: IncomingTransaction;
  derivationPath: string;
  contentWindow: Window;
}): Promise<SignTransactionResult> {
  const paymasterEligible = Boolean(incomingTx.customData?.paymasterParams);
  const transaction = prepareTransaction(incomingTx);
  if (paymasterEligible) {
    const eip712Tx = omit(transaction, ['authorizationList']);
    const typedData = createTypedData(eip712Tx);

    const ledgerSignature = await messageHandler.request<string>(
      {
        id: nanoid(),
        method: 'signTypedData_v4',
        params: { derivationPath, typedData },
      },
      contentWindow
    );
    /**
     * Ethereum signature's `v` value can either be in range [0, 1] or [27, 28]
     * Both signatures can be valid, so this historically allowed for double spends.
     * Some systems decided to check this and accept only one kind.
     * Currently our own ledger adapter code subtracts 27 (to conform to some dapp's expectations),
     * but zkSync stack seems to expect [27, 28]
     * Therefore we add this number for this particular case
     */
    const s = ethers.Signature.from(ledgerSignature);
    if ((s.v as number) === 0 || (s.v as number) === 1) {
      s.v += 27;
    }
    const signature = ethers.Signature.from(s).serialized;
    const rawTransaction = serializePaymasterTx({
      transaction: eip712Tx,
      signature,
    });
    return { serialized: rawTransaction };
  } else {
    return await messageHandler.request<SignTransactionResult>(
      {
        id: nanoid(),
        method: 'signTransaction',
        params: { derivationPath, transaction },
      },
      contentWindow
    );
  }
}

interface SignTransactionParams {
  transaction: IncomingTransaction;
  address: string;
  chain: Chain;
}

export interface SignTransactionHandle {
  signTransaction: ({
    transaction,
    address,
    chain,
  }: SignTransactionParams) => Promise<string>;
}

async function prepareForSignByLedger({
  transaction,
  address,
  network,
}: {
  transaction: IncomingTransaction;
  address: string;
  network: NetworkConfig;
}) {
  const value = { ...transaction };
  if (value.nonce == null) {
    const { value: nonce } = await uiGetBestKnownTransactionCount({
      address,
      network,
      defaultBlock: 'pending',
    });
    value.nonce = nonce;
  }
  if (!value.chainId) {
    const chainId = Networks.getChainId(network);
    invariant(chainId, 'Unable to find chainId for transaction');
    value.chainId = chainId;
  }
  return value;
}

export const HardwareSignTransaction = React.forwardRef(
  function HardwareSignTransaction(
    {
      derivationPath,
      isSending,
      children,
      buttonTitle,
      buttonKind = 'primary',
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      derivationPath: string;
      isSending: boolean;
      buttonTitle?: React.ReactNode;
      buttonKind?: ButtonKind;
    },
    ref: React.Ref<SignTransactionHandle>
  ) {
    const navigate = useNavigate();
    const location = useLocation();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const { mutateAsync: signTransaction, ...signMutation } = useMutation({
      mutationFn: async ({
        transaction,
        address,
        chain,
      }: SignTransactionParams): Promise<string> => {
        const networksStore = await getNetworksStore();
        const network = await networksStore.fetchNetworkById(chain.toString());
        const txForLedger = await prepareForSignByLedger({
          transaction,
          address,
          network,
        });
        const normalizedTransaction = prepareTransaction(txForLedger);
        invariant(iframeRef.current, 'Ledger iframe not found');
        invariant(
          iframeRef.current.contentWindow,
          'Iframe contentWindow is not available'
        );
        try {
          const result = await signRegularOrPaymasterTx({
            transaction: normalizedTransaction,
            messageHandler: hardwareMessageHandler,
            derivationPath,
            contentWindow: iframeRef.current.contentWindow,
          });
          return result.serialized;
        } catch (error) {
          const normalizedError = getError(error);
          if (normalizedError.message === 'ConnectError') {
            navigate(
              `/connect-hardware-wallet?${new URLSearchParams({
                strategy: 'connect',
                next: `${location.pathname}${location.search}`,
                replaceAfterRedirect: 'true',
              })}`
            );
            // NOTE: TODO: should we throw the same error here? Or return meaningless <string> to match fn signature?
            throw normalizedError;
          } else {
            throw normalizedError;
          }
        }
      },
    });

    useImperativeHandle(ref, () => ({ signTransaction }));

    return (
      <>
        <LedgerIframe
          ref={iframeRef}
          initialRoute="/signConnector"
          style={{
            position: 'absolute',
            border: 'none',
            backgroundColor: 'transparent',
          }}
          tabIndex={-1}
          height={0}
        />
        {signMutation.isLoading ? (
          <Button
            kind="loading-border"
            disabled={true}
            title="Follow instructions on your ledger device"
          >
            <TextPulse>Sign on Device</TextPulse>
          </Button>
        ) : (
          <Button
            kind={buttonKind}
            disabled={signMutation.isLoading || isSending}
            style={{
              paddingInline: 16, // fit longer button label
            }}
            {...buttonProps}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <LedgerIcon />
              {children || // all this will definitely be refactored soon
                (isSending ? 'Sending' : buttonTitle || 'Sign with Ledger')}
            </HStack>
          </Button>
        )}
      </>
    );
  }
);
