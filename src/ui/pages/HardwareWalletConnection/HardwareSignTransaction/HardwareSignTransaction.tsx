import React, { useRef } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { Button } from 'src/ui/ui-kit/Button';
import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { RpcRequest } from 'src/shared/custom-rpc';
import { isRpcResponse, isRpcResult } from 'src/shared/custom-rpc';
import { useLocation, useNavigate } from 'react-router-dom';
import { getError } from 'src/shared/errors/getError';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';
import type { SignTransactionResult } from 'src/ui/hardware-wallet/types';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';

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
  onSignError,
}: {
  derivationPath: string;
  getTransaction: () => Promise<IncomingTransaction>;
  onSign: (serialized: string) => void;
  isSending: boolean;
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
      const normalizedError = getError(error);
      if (normalizedError.message === 'disconnected') {
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
        initialRoute="/signTransaction"
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
          paddingInline: 24, // fit longer button label
        }}
      >
        {isSending
          ? 'Sending...'
          : signMutation.isLoading
          ? 'Sign...'
          : 'Sign from Ledger'}
      </Button>
    </>
  );
}
