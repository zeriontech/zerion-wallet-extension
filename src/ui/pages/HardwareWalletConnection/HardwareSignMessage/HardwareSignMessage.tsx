import { nanoid } from 'nanoid';
import React, { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { getError } from 'src/shared/errors/getError';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { TextPulse } from 'src/ui/components/TextPulse';
import { hardwareMessageHandler } from '../shared/messageHandler';

type Props = {
  derivationPath: string;
  onSign: (serialized: string) => void;
  isSigning: boolean;
  onBeforeSign: () => void;
  onSignError: (error: Error) => void;
  kind?: ButtonKind;
  buttonTitle?: React.ReactNode;
} & (
  | { type: 'personalSign'; message: string }
  | { type: 'signTypedData_v4'; message: string | TypedData }
);

export function HardwareSignMessage({
  type,
  message,
  derivationPath,
  onSign,
  isSigning,
  onBeforeSign,
  onSignError,
  kind = 'primary',
  buttonTitle,
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
        const result = await hardwareMessageHandler.request<string>(
          {
            id: nanoid(),
            method: 'signTypedData_v4',
            params: {
              derivationPath,
              typedData: message,
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
        initialRoute="/signConnector"
        style={{
          position: 'absolute',
          border: 'none',
          backgroundColor: 'transparent',
        }}
        tabIndex={-1}
        height={0}
      />
      {isLoading ? (
        <Button
          kind="loading-border"
          disabled={true}
          title="Follow instructions on your ledger device"
        >
          <TextPulse>Sign on Device</TextPulse>
        </Button>
      ) : (
        <Button
          kind={kind}
          onClick={() =>
            type === 'personalSign' ? personalSign() : signTypedData_v4()
          }
          disabled={isLoading || isSigning}
          style={{
            paddingInline: 16, // fit longer button label
          }}
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            <LedgerIcon />
            {isSigning ? 'Sending...' : buttonTitle || 'Sign with Ledger'}
          </HStack>
        </Button>
      )}
    </>
  );
}
