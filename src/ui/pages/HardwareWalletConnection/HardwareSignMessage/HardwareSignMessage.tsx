import { nanoid } from 'nanoid';
import React, { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { getError } from 'src/shared/errors/getError';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { hardwareMessageHandler } from '../shared/messageHandler';

type Props = {
  derivationPath: string;
  onSign: (serialized: string) => void;
  isSigning: boolean;
  onBeforeSign: () => void;
  onSignError: (error: Error) => void;
} & (
  | { type: 'personalSign'; getMessage(): string }
  | { type: 'signTypedData_v4'; getMessage(): string | TypedData }
);

export function HardwareSignMessage({
  type,
  getMessage,
  derivationPath,
  onSign,
  isSigning,
  onBeforeSign,
  onSignError,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const ref = useRef<HTMLIFrameElement | null>(null);

  const handleError = useCallback(
    (error: unknown) => {
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
    [onSignError, location, navigate]
  );

  const { mutate: personalSign, ...personalSignMutation } = useMutation({
    mutationFn: async () => {
      invariant(
        type === 'personalSign',
        'personalSign method should be called from personalSign screen'
      );
      invariant(ref.current, 'Ledger iframe not found');
      invariant(
        ref.current.contentWindow,
        'Iframe contentWindow is not available'
      );
      const message = getMessage();
      const result = await hardwareMessageHandler.request<string>(
        {
          id: nanoid(),
          method: 'personalSign',
          params: {
            derivationPath,
            message,
          },
        },
        ref.current.contentWindow
      );
      onSign(result);
    },
    onMutate: () => onBeforeSign(),
    onError: handleError,
  });

  const { mutate: signTypedData_v4, ...signTypedData_v4Mutation } = useMutation(
    {
      mutationFn: async () => {
        invariant(
          type === 'signTypedData_v4',
          'signTypedData_v4 method should be called from signTypedData_v4 screen'
        );
        invariant(ref.current, 'Ledger iframe not found');
        invariant(
          ref.current.contentWindow,
          'Iframe contentWindow is not available'
        );
        const typedData = getMessage();
        const result = await hardwareMessageHandler.request<string>(
          {
            id: nanoid(),
            method: 'signTypedData_v4',
            params: {
              derivationPath,
              typedData,
            },
          },
          ref.current.contentWindow
        );
        onSign(result);
      },
      onMutate: () => onBeforeSign(),
      onError: handleError,
    }
  );

  const isLoading =
    type === 'personalSign'
      ? personalSignMutation.isLoading
      : signTypedData_v4Mutation.isLoading;

  return (
    <>
      <LedgerIframe
        ref={ref}
        initialRoute={
          type === 'personalSign' ? '/personalSign' : '/signTypedData_v4'
        }
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
        onClick={() =>
          type === 'personalSign' ? personalSign() : signTypedData_v4()
        }
        disabled={isLoading || isSigning}
        style={{
          paddingInline: 24, // fit longer button label
        }}
      >
        <HStack gap={8} alignItems="center">
          <LedgerIcon />
          {isSigning
            ? 'Sending...'
            : isLoading
            ? 'Sign...'
            : 'Sign from Ledger'}
        </HStack>
      </Button>
    </>
  );
}
