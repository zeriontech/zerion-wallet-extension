import React, { useImperativeHandle, useRef } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { Button } from 'src/ui/ui-kit/Button';
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
import { getTransactionCount } from 'src/modules/ethereum/transactions/getTransactionCount';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { TextPulse } from 'src/ui/components/TextPulse';
import { hardwareMessageHandler } from '../shared/messageHandler';

interface SignTransactionParams {
  transaction: IncomingTransaction;
  address: string;
  chain: Chain;
}

export interface SignHandle {
  signTransaction: ({
    transaction,
    address,
    chain,
  }: SignTransactionParams) => Promise<string>;
}

async function prepareForSignByLedger({
  transaction,
  address,
  chain,
  networks,
}: {
  transaction: IncomingTransaction;
  address: string;
  chain: Chain;
  networks: Networks;
}) {
  const value = { ...transaction };
  if (value.nonce == null) {
    const { value: nonce } = await getTransactionCount({
      address,
      chain,
      networks,
      defaultBlock: 'pending',
    });
    value.nonce = parseInt(nonce);
  }
  if (!value.chainId) {
    value.chainId = networks.getChainId(chain);
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
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      derivationPath: string;
      isSending: boolean;
      buttonTitle?: React.ReactNode;
    },
    ref: React.Ref<SignHandle>
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
        const networks = await networksStore.load();
        const txForLedger = await prepareForSignByLedger({
          transaction,
          address,
          chain,
          networks,
        });
        const normalizedTransaction = prepareTransaction(txForLedger);
        invariant(iframeRef.current, 'Ledger iframe not found');
        invariant(
          iframeRef.current.contentWindow,
          'Iframe contentWindow is not available'
        );
        try {
          const result =
            await hardwareMessageHandler.request<SignTransactionResult>(
              {
                id: nanoid(),
                method: 'signTransaction',
                params: {
                  derivationPath,
                  transaction: normalizedTransaction,
                },
              },
              iframeRef.current.contentWindow
            );
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
            kind="primary"
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
