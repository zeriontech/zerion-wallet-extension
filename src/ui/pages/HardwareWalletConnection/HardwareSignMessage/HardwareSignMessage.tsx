import { nanoid } from 'nanoid';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { Button, type Kind as ButtonKind } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { TextPulse } from 'src/ui/components/TextPulse';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { openUrl } from 'src/ui/shared/openUrl';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { urlContext } from 'src/shared/UrlContext';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import {
  deniedByUser,
  parseLedgerError,
} from '@zeriontech/hardware-wallet-connection';
import { isAllowedMessage } from '../shared/isAllowedMessage';
import { hardwareMessageHandler } from '../shared/messageHandler';

type Props = {
  derivationPath: string;
  isSigning: boolean;
  buttonTitle?: React.ReactNode;
  buttonKind?: ButtonKind;
  ecosystem: BlockchainType;
  bluetoothSupportEnabled: boolean;
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
      bluetoothSupportEnabled,
      ...buttonProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Props,
    ref: React.Ref<SignMessageHandle>
  ) {
    const navigate = useNavigate();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

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
          const normalizedError = parseLedgerError(error);
          if (deniedByUser(normalizedError)) {
            throw new Error('Signature denied by user');
          }
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
            const normalizedError = parseLedgerError(error);
            if (deniedByUser(normalizedError)) {
              throw new Error('Signature denied by user');
            }
            throw normalizedError;
          }
        },
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
            const normalizedError = parseLedgerError(error);
            if (deniedByUser(normalizedError)) {
              throw new Error('Signature denied by user');
            }
            throw normalizedError;
          }
        },
      });

    useEffect(() => {
      async function handler(event: MessageEvent) {
        invariant(iframeRef.current, 'Iframe should be mounted');
        if (!isAllowedMessage(event, iframeRef.current)) {
          return;
        }
        if (isRpcRequest(event.data)) {
          const { method } = event.data;
          if (
            method === 'ledger/sign/success' ||
            method === 'ledger/sign/resume' ||
            method === 'ledger/sign/error' ||
            method === 'ledger/sign/cancel'
          ) {
            dialogRef.current?.close();
          } else if (
            method === 'ledger/sign/notConnected' ||
            method === 'ledger/sign/interactionRequested'
          ) {
            dialogRef.current?.showModal();
          } else if (method === 'ledger/sign/openInTab') {
            const url = new URL(window.location.href);
            openUrl(url, { windowType: 'tab' });
            navigate('/');
          }
        }
      }
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [navigate]);

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
        personalSignMutation.reset();
        signTypedData_v4Mutation.reset();
        solana_signMessageMutation.reset();
        dialogRef.current?.close();
      }
    }, [
      isError,
      isSuccess,
      personalSignMutation,
      signTypedData_v4Mutation,
      solana_signMessageMutation,
    ]);

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
          <LedgerIframe
            ref={iframeRef}
            initialRoute="/signConnector"
            appSearchParams={new URLSearchParams({
              ecosystem,
              windowType: urlContext.windowType,
              supportBluetooth: `${Boolean(bluetoothSupportEnabled)}`,
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
        </BottomSheetDialog>
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
