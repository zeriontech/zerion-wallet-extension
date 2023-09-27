import { useStore } from '@store-unit/react';
import React, { useId, useRef } from 'react';
import { themeStore } from 'src/ui/features/appearance';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { Button } from 'src/ui/ui-kit/Button';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { RpcRequest } from 'src/shared/custom-rpc';
import { isRpcResponse, isRpcResult } from 'src/shared/custom-rpc';
import { useLocation, useNavigate } from 'react-router-dom';
import { getError } from 'src/shared/errors/getError';
import { UIText } from 'src/ui/ui-kit/UIText';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';
import type { SignTransactionResult } from 'src/ui/hardware-wallet/types';

class MessageHandler {
  emitter = createNanoEvents<{
    message: (msg: unknown) => void;
    postMessage: (msg: RpcRequest) => void;
  }>();

  constructor() {
    window.addEventListener('message', this.handleMessage);
  }

  handleMessage = (event: MessageEvent) => {
    this.emitter.emit('message', event.data);
  };

  destroy() {
    window.removeEventListener('message', this.handleMessage);
  }

  request<T>(request: RpcRequest, contentWindow: Window): Promise<T> {
    const { id } = request;
    contentWindow.postMessage(request, '*');
    return new Promise((resolve, reject) => {
      const unlisten = this.emitter.on('message', (msg) => {
        if (isRpcResponse(msg)) {
          if (id === msg.id) {
            if (isRpcResult(msg)) {
              resolve(msg.result as T);
            } else {
              reject(msg.error);
            }
            unlisten();
          }
        }
      });
    });
  }
}

const messageHandler = new MessageHandler();

export function HardwareSignTransaction({
  derivationPath,
  getTransaction,
  onSign,
  isSending,
}: {
  derivationPath: string;
  getTransaction: () => Promise<IncomingTransaction>;
  onSign: (serialized: string) => void;
  isSending: boolean;
}) {
  const themeState = useStore(themeStore);

  const navigate = useNavigate();
  const location = useLocation();

  const requestId = useId();
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
      const result = await messageHandler.request<SignTransactionResult>(
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
    onError(error) {
      if (getError(error).message === 'disconnected') {
        navigate(
          `/connect-hardware-wallet?${new URLSearchParams({
            strategy: 'connect',
            next: `${location.pathname}${location.search}`,
          })}`
        );
      }
    },
  });

  return (
    <>
      <iframe
        ref={ref}
        id="the-ledger-test"
        // This is crucial: by lifting only "allow-scripts" restriction
        // we restrict everything else, inluding "allow-same-origin" token.
        // By doing this, the iframe code will be treated by the background script
        // as a third-party origin.
        sandbox="allow-scripts"
        allow="usb"
        src={`ui/hardware-wallet/ledger.html?theme-state=${encodeURIComponent(
          JSON.stringify(themeState)
        )}&request-id=${requestId}#/signTransaction`}
        style={{ border: 'none', backgroundColor: 'transparent' }}
        width="100%"
        height={0}
      />
      {signMutation.isError ? (
        <UIText kind="small/regular" color="var(--negative-500)">
          {getError(signMutation.error).message}
        </UIText>
      ) : null}
      <Button
        kind="primary"
        onClick={() => signTransaction()}
        disabled={signMutation.isLoading || isSending}
      >
        {isSending
          ? 'Sending...'
          : signMutation.isLoading
          ? 'Sign...'
          : 'Sign Transaction from Ledger'}
      </Button>
    </>
  );
}
