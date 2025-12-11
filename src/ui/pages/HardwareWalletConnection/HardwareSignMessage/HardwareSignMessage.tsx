import { nanoid } from 'nanoid';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { TroubleshootingDialog } from 'src/ui/hardware-wallet/TroubleshootingDialog';
import type { LedgerError } from '@zeriontech/hardware-wallet-connection';
import { parseLedgerError } from '@zeriontech/hardware-wallet-connection';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { isObj } from 'src/shared/isObj';
import { openUrl } from 'src/ui/shared/openUrl';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { urlContext } from 'src/shared/UrlContext';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { isAllowedMessage } from '../shared/isAllowedMessage';
import { hardwareMessageHandler } from '../shared/messageHandler';

type Props = {
  derivationPath: string;
  isSigning: boolean;
  buttonTitle?: React.ReactNode;
  buttonKind?: ButtonKind;
  ecosystem: BlockchainType;
};

export interface SignMessageHandle {
  personalSign: (message: string) => Promise<string>;
  signTypedData_v4: (typedData: string | TypedData) => Promise<string>;
  solana_signMessage: (messageHex: string) => Promise<string>;
}

export const HardwareSignMessage = React.forwardRef(
  function HardwareSignMessage(
    {
      derivationPath,
      isSigning,
      buttonKind = 'primary',
      children,
      buttonTitle,
      ecosystem,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Props,
    ref: React.Ref<SignMessageHandle>
  ) {
    const navigate = useNavigate();
    const location = useLocation();
    const { globalPreferences } = useGlobalPreferences();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

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

    const { mutateAsync: solana_signMessage, ...solana_signMessageMutation } =
      useMutation({
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
                method: 'solana_signMessage',
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
        onError: handleError,
      });

    const [signError, setSignError] = useState<LedgerError | null>(null);

    useEffect(() => {
      async function handler(event: MessageEvent) {
        invariant(iframeRef.current, 'Iframe should be mounted');
        if (!isAllowedMessage(event, iframeRef.current)) {
          return;
        }
        if (isRpcRequest(event.data)) {
          const { method, params } = event.data;
          if (
            method === 'ledger/sign/success' ||
            method === 'ledger/sign/resume'
          ) {
            dialogRef.current?.close();
            setSignError(null);
          } else if (method === 'ledger/sign/error') {
            dialogRef.current?.close();
            setSignError(
              isObj(params) && 'error' in params
                ? parseLedgerError(params.error)
                : null
            );
          } else if (
            method === 'ledger/sign/notConnected' ||
            method === 'ledger/sign/interactionRequested'
          ) {
            dialogRef.current?.showModal();
          } else if (method === 'ledger/sign/openInTab') {
            const url = new URL(window.location.href);
            openUrl(url, { windowType: 'tab' });
            setSignError(null);
          }
        }
      }
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, []);

    const isError =
      personalSignMutation.isError ||
      signTypedData_v4Mutation.isError ||
      solana_signMessageMutation.isError;
    const isSuccess =
      signTypedData_v4Mutation.isSuccess ||
      personalSignMutation.isSuccess ||
      solana_signMessageMutation.isSuccess;
    useEffect(() => {
      if (isError || isSuccess) {
        dialogRef.current?.close();
      }
    }, [isError, isSuccess]);

    useImperativeHandle(ref, () => ({
      personalSign,
      signTypedData_v4,
      solana_signMessage,
    }));

    const isLoading =
      personalSignMutation.isLoading ||
      signTypedData_v4Mutation.isLoading ||
      solana_signMessageMutation.isLoading;

    return (
      <>
        <BottomSheetDialog
          ref={dialogRef}
          closeOnClickOutside={false}
          height="fit-content"
        >
          {globalPreferences ? (
            <LedgerIframe
              ref={iframeRef}
              initialRoute="/signConnector"
              appSearchParams={new URLSearchParams({
                ecosystem,
                windowType: urlContext.windowType,
                supportBluetooth: `${Boolean(
                  globalPreferences.bluetoothSupportEnabled
                )}`,
              }).toString()}
              style={{
                // border: 'none',
                backgroundColor: 'transparent',
              }}
              // @ts-ignore
              allowtransparency="true"
              tabIndex={-1}
              height={300}
            />
          ) : null}
        </BottomSheetDialog>
        <VStack gap={8}>
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
          {signError ? <TroubleshootingDialog error={signError} /> : null}
        </VStack>
      </>
    );
  }
);
