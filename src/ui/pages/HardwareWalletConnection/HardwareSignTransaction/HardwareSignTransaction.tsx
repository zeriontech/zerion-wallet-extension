import React, { useRef } from 'react';
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
import { hardwareMessageHandler } from '../shared/messageHandler';

export function HardwareSignTransaction({
  derivationPath,
  getTransaction,
  onSign,
  isSending,
  onBeforeSign,
  onSignError,
}: {
  derivationPath: string;
  getTransaction: () => Promise<IncomingTransaction>;
  onSign: (serialized: string) => void;
  isSending: boolean;
  onBeforeSign: () => void;
  onSignError: (error: Error) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const ref = useRef<HTMLIFrameElement | null>(null);

  const { mutate: signTransaction, ...signMutation } = useMutation({
    mutationFn: async () => {
      const transaction = await getTransaction();
      const normalizedTransaction = prepareTransaction(transaction);
      invariant(ref.current, 'Ledger iframe not found');
      invariant(
        ref.current.contentWindow,
        'Iframe contentWindow is not available'
      );
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
          ref.current.contentWindow
        );
      onSign(result.serialized);
    },
    onMutate: () => onBeforeSign(),
    onError(error) {
      const normalizedError = getError(error);
      if (normalizedError.message === 'ConnectError') {
        navigate(
          `/connect-hardware-wallet?${new URLSearchParams({
            strategy: 'connect',
            next: `${location.pathname}${location.search}`,
          })}`
        );
      } else {
        onSignError(normalizedError);
      }
    },
  });

  return (
    <>
      <LedgerIframe
        ref={ref}
        initialRoute="/signConnector"
        style={{
          position: 'absolute',
          border: 'none',
          backgroundColor: 'transparent',
        }}
        tabIndex={-1}
        height={0}
      />
      <Button
        kind="primary"
        onClick={() => signTransaction()}
        disabled={signMutation.isLoading || isSending}
        style={{
          paddingInline: 16, // fit longer button label
        }}
      >
        <HStack gap={8} alignItems="center">
          <LedgerIcon />
          {isSending
            ? 'Sending...'
            : signMutation.isLoading
            ? 'Sign...'
            : 'Sign with Ledger'}
        </HStack>
      </Button>
    </>
  );
}
