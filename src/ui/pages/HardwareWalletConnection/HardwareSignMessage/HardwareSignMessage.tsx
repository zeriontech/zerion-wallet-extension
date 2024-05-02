import { nanoid } from 'nanoid';
import React, { useCallback, useImperativeHandle, useRef } from 'react';
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
  isSigning: boolean;
  buttonTitle?: React.ReactNode;
  buttonKind?: ButtonKind;
};

export interface SignMessageHandle {
  personalSign: (message: string) => Promise<string>;
  signTypedData_v4: (typedData: string | TypedData) => Promise<string>;
}

export const HardwareSignMessage = React.forwardRef(
  function HardwareSignMessage(
    {
      derivationPath,
      isSigning,
      buttonKind = 'primary',
      children,
      buttonTitle,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Props,
    ref: React.Ref<SignMessageHandle>
  ) {
    const navigate = useNavigate();
    const location = useLocation();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const handleError = useCallback(
      (error: unknown) => {
        const normalizedError = getError(error);
        if (normalizedError.message === 'ConnectError') {
          navigate(
            `/connect-hardware-wallet?${new URLSearchParams({
              strategy: 'connect',
              next: `${location.pathname}${location.search}`,
              replaceAfterRedirect: 'true',
            })}`
          );
          return normalizedError;
        } else {
          return normalizedError;
        }
      },
      [location, navigate]
    );

    const { mutateAsync: personalSign, ...personalSignMutation } = useMutation({
      mutationFn: async (message: string) => {
        invariant(iframeRef.current, 'Ledger iframe not found');
        invariant(
          iframeRef.current.contentWindow,
          'Iframe contentWindow is not available'
        );
        try {
          const result = await hardwareMessageHandler.request<string>(
            {
              id: nanoid(),
              method: 'personalSign',
              params: { derivationPath, message },
            },
            iframeRef.current.contentWindow
          );
          return result;
        } catch (error) {
          const normalizedError = handleError(error);
          throw normalizedError;
        }
      },
    });

    const { mutateAsync: signTypedData_v4, ...signTypedData_v4Mutation } =
      useMutation({
        mutationFn: async (typedData: string | TypedData) => {
          invariant(iframeRef.current, 'Ledger iframe not found');
          invariant(
            iframeRef.current.contentWindow,
            'Iframe contentWindow is not available'
          );
          try {
            const result = await hardwareMessageHandler.request<string>(
              {
                id: nanoid(),
                method: 'signTypedData_v4',
                params: { derivationPath, typedData },
              },
              iframeRef.current.contentWindow
            );
            return result;
          } catch (error) {
            const normalizedError = handleError(error);
            throw normalizedError;
          }
        },
        onError: handleError,
      });

    useImperativeHandle(ref, () => ({ personalSign, signTypedData_v4 }));

    const isLoading =
      personalSignMutation.isLoading || signTypedData_v4Mutation.isLoading;

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
            kind={buttonKind}
            disabled={isLoading || isSigning}
            style={{
              paddingInline: 16, // fit longer button label
            }}
            {...buttonProps}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <LedgerIcon />
              {children ||
                (isSigning ? 'Sending' : buttonTitle || 'Sign with Ledger')}
            </HStack>
          </Button>
        )}
      </>
    );
  }
);
