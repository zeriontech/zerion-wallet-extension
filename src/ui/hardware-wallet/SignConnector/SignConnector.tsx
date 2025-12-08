import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type {
  TransportIdentifier,
  UserInteractionRequested,
} from '@zeriontech/hardware-wallet-connection';
import {
  checkDevice,
  signTransaction,
  personalSign,
  signSolanaTransaction,
  signTypedData_v4,
  connectDevice,
  transports,
  parseLedgerError,
} from '@zeriontech/hardware-wallet-connection';
import type { RpcRequest } from 'src/shared/custom-rpc';
import {
  isRpcRequest,
  isRpcResponse,
  isRpcResult,
} from 'src/shared/custom-rpc';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import { createNanoEvents } from 'nanoevents';
import {
  solFromBase64,
  solToBase64,
} from 'src/modules/solana/transactions/create';
import { uint8ArrayToBase64 } from 'src/modules/crypto';
import { Transaction } from '@solana/web3.js';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { HStack } from 'src/ui/ui-kit/HStack';
import { InteractionRequested } from '../InterationRequested/InteractionRequested';
import {
  assertPersonalSignParams,
  assertSignSolanaTransactionParams,
  assertSignTransactionParams,
  assertSignTypedData_v4Params,
} from './helpers';

async function getConnectedSessionId({
  transport = transports.hid,
}: {
  transport?: TransportIdentifier;
}) {
  return Promise.race([
    rejectAfterDelay(1000, 'Device not connected').catch(() => null),
    checkDevice({ transportIdentifier: transport })
      .then(({ sessionId }) => sessionId)
      .catch(() => null),
  ]);
}

type HardwareRPCRequest = Omit<RpcRequest, 'id'> & {
  id?: string;
  transport?: TransportIdentifier;
  sessionId?: string;
};

function isHardwareRpcRequest(
  payload: Partial<RpcRequest> | unknown
): payload is HardwareRPCRequest {
  return isRpcRequest(payload);
}

export class DeviceController {
  private emitter = createNanoEvents<{
    message: (msg: unknown) => void;
  }>();

  private onNotConnected?: (message: HardwareRPCRequest) => void;
  private onInteractionRequested?: (type: UserInteractionRequested) => void;

  static signTransaction =
    (params: unknown) =>
    async (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertSignTransactionParams(params);
      return signTransaction(
        {
          derivationPath: params.derivationPath,
          rawTransaction: params.transaction,
        },
        { sessionId, onInteractionRequested }
      );
    };

  static solana_signTransaction =
    (params: unknown) =>
    async (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertSignSolanaTransactionParams(params);

      const transaction = solFromBase64(params.transaction);
      const cleanedTransaction =
        transaction instanceof Transaction
          ? uint8ArrayToBase64(transaction.serializeMessage())
          : uint8ArrayToBase64(transaction.message.serialize());

      const { signature } = await signSolanaTransaction(
        {
          derivationPath: params.derivationPath,
          transaction: cleanedTransaction,
        },
        { sessionId, onInteractionRequested }
      );

      if (transaction instanceof Transaction) {
        transaction.signatures = [
          {
            publicKey: transaction.feePayer!,
            signature,
          },
        ];
      } else {
        transaction.signatures[0] = signature;
      }
      return solToBase64(transaction);
    };

  static personalSign =
    (params: unknown) =>
    async (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertPersonalSignParams(params);
      const message = toUtf8String(params.message);
      return personalSign(
        { derivationPath: params.derivationPath, message },
        { sessionId, onInteractionRequested }
      );
    };

  static signTypedData_v4 =
    (params: unknown) =>
    async (
      sessionId: string,
      onInteractionRequested?: (type: UserInteractionRequested) => void
    ) => {
      assertSignTypedData_v4Params(params);
      return signTypedData_v4(
        {
          derivationPath: params.derivationPath,
          rawTypedData: params.typedData,
        },
        { sessionId, onInteractionRequested }
      );
    };

  listener = async (event: MessageEvent) => {
    if (isHardwareRpcRequest(event.data)) {
      const { id, method, params, transport = transports.hid } = event.data;
      if (
        isClassProperty(DeviceController, method) &&
        typeof DeviceController[method] === 'function'
      ) {
        try {
          let sessionId = event.data.sessionId || null;
          if (!sessionId) {
            sessionId = await getConnectedSessionId({ transport });
          }
          if (!sessionId) {
            this.onNotConnected?.(event.data);
            return;
          }
          const result = await DeviceController[method](params)(
            // @ts-ignore Controller[method] should be callable here
            sessionId,
            this.onInteractionRequested
          );
          window.parent.postMessage({ id, result }, window.location.origin);
        } catch (error) {
          window.parent.postMessage(
            { id, error: parseLedgerError(error) },
            window.location.origin
          );
        }
      }
    }
    this.emitter.emit('message', event.data);
  };

  request({
    method,
    params,
    id: maybeId,
  }: Omit<RpcRequest, 'id'> & { id?: string }) {
    const id = maybeId ?? nanoid();
    window.parent.postMessage({ id, method, params }, window.location.origin);
    return new Promise((resolve, reject) => {
      const unlisten = this.emitter.on('message', (msg: unknown) => {
        if (isRpcResponse(msg)) {
          if (msg.id === id) {
            if (isRpcResult(msg)) {
              resolve(msg.result);
            } else {
              reject(msg.error);
            }
            unlisten();
          }
        }
      });
    });
  }

  listen({
    onNotConnected,
    onInteractionRequested,
  }: {
    onNotConnected?: (message: HardwareRPCRequest) => void;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  } = {}) {
    this.onNotConnected = onNotConnected;
    this.onInteractionRequested = onInteractionRequested;
    window.addEventListener('message', this.listener);
    return () => {
      window.removeEventListener('message', this.listener);
    };
  }
}

export function SignConnector() {
  const [interruptedRequest, setInterruptedRequest] =
    useState<HardwareRPCRequest | null>(null);
  const [interactionRequested, setInteractionRequested] =
    useState<UserInteractionRequested | null>(null);
  const [controller] = useState(() => new DeviceController());
  useEffect(() => {
    return controller.listen({
      onNotConnected: (request) => {
        setInterruptedRequest(request);
        controller.request({ method: 'ledger/sign/notConnected', params: {} });
      },
      onInteractionRequested: (type) => {
        setInteractionRequested(type);
        controller.request({
          method: 'ledger/sign/interactionRequested',
          params: { type },
        });
      },
    });
  }, [controller]);
  const [params] = useSearchParams();
  const ecosystem = (params.get('ecosystem') as BlockchainType) || 'evm';
  const { mutate } = useMutation({
    mutationFn: async (transport: TransportIdentifier) => {
      const { sessionId } = await connectDevice({
        transportIdentifier: transport,
      });
      window.postMessage({ ...interruptedRequest, transport, sessionId });
    },
    onSettled: () => {
      setInterruptedRequest(null);
      setInteractionRequested(null);
    },
    onError: (error) => {
      controller.request({ method: 'ledger/sign/error', params: { error } });
    },
    onSuccess: () => {
      controller.request({ method: 'ledger/sign/success', params: {} });
    },
  });

  return interruptedRequest ? (
    <VStack gap={8}>
      <Button onClick={() => mutate(transports.hid)}>Sign via USB</Button>
      <Button onClick={() => mutate(transports.bluetooth)}>
        Sign via Bluetooth
      </Button>
    </VStack>
  ) : interactionRequested ? (
    <InteractionRequested kind={interactionRequested} ecosystem={ecosystem} />
  ) : null;
}
