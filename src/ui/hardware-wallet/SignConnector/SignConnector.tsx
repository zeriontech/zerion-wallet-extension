import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type { TransportIdentifier } from '@zeriontech/hardware-wallet-connection';
import {
  checkDevice,
  signTransaction,
  personalSign,
  signSolanaTransaction,
  signTypedData_v4,
  connectDevice,
  transports,
  getAddressesEth,
} from '@zeriontech/hardware-wallet-connection';
import type { RpcRequest } from 'src/shared/custom-rpc';
import {
  isRpcRequest,
  isRpcResponse,
  isRpcResult,
} from 'src/shared/custom-rpc';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import { getError } from 'src/shared/errors/getError';
import { createNanoEvents } from 'nanoevents';
import {
  solFromBase64,
  solToBase64,
} from 'src/modules/solana/transactions/create';
import { base64ToArrayBuffer, uint8ArrayToBase64 } from 'src/modules/crypto';
import { Transaction } from '@solana/web3.js';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { useMutation } from '@tanstack/react-query';
import { normalizeDeviceError } from '../shared/errors';
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
    rejectAfterDelay(1000, 'Device not connected').catch(() => false),
    checkDevice({ transportIdentifier: transport })
      .then(({ sessionId }) => sessionId)
      .catch(() => false),
  ]);
}

export class DeviceController {
  private emitter = createNanoEvents<{
    message: (msg: unknown) => void;
  }>();

  private onNotConnected?: (
    message: Omit<RpcRequest, 'id'> & { id?: string }
  ) => void;

  static signTransaction = (params: unknown) => async (sessionId: string) => {
    assertSignTransactionParams(params);
    // return getAddressesEth(sessionId, {
    //   type: 'ledgerLive',
    //   from: 0,
    //   count: 2,
    // });
    // console.log('Signing transaction with params', params);
    // await wait(100);
    // console.log('Proceeding to sign transaction...');
    return signTransaction(
      params.derivationPath,
      params.transaction,
      sessionId
    );
  };

  static solana_signTransaction =
    (params: unknown) => async (sessionId: string) => {
      assertSignSolanaTransactionParams(params);
      console.log('Signing transaction with params', params);

      // Deserialize, remove signatures, and serialize back to base64
      const transaction = solFromBase64(params.transaction);

      const cleanedTransaction =
        transaction instanceof Transaction
          ? uint8ArrayToBase64(transaction.serializeMessage())
          : uint8ArrayToBase64(transaction.message.serialize());

      console.log('Original transaction:', params.transaction);
      console.log('Cleaned transaction:', cleanedTransaction);
      console.log({ transaction });

      // @ts-ignore params.transaction is object
      const { signature } = await signSolanaTransaction(
        params.derivationPath,
        cleanedTransaction,
        sessionId
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

      console.log({ transaction });
      const base64Transaction = solToBase64(transaction);
      console.log('Signed transaction base64:', base64Transaction);

      return base64Transaction;
    };

  static personalSign = (params: unknown) => async (sessionId: string) => {
    assertPersonalSignParams(params);
    console.log('Signing message with params', params);
    const message = toUtf8String(params.message);
    return personalSign(params.derivationPath, message, sessionId);
  };

  static signTypedData_v4 = (params: unknown) => async (sessionId: string) => {
    assertSignTypedData_v4Params(params);
    // @ts-ignore params.typedData is object
    return signTypedData_v4(params.derivationPath, params.typedData, sessionId);
  };

  listener = async (event: MessageEvent) => {
    console.log('SignConnector received message', event.data);
    if (isRpcRequest(event.data)) {
      const transport =
        'transport' in event.data
          ? (event.data.transport as TransportIdentifier)
          : transports.hid;
      let sessionId = 'sessionId' in event.data ? event.data.sessionId : '';
      const { id, method, params } = event.data;
      if (
        isClassProperty(DeviceController, method) &&
        typeof DeviceController[method] === 'function'
      ) {
        try {
          console.log(
            `Invoking DeviceController.${method} with params`,
            params
          );
          if (!sessionId) {
            sessionId = await getConnectedSessionId({ transport });
          }
          console.log('Device connection status:', sessionId);
          if (!sessionId) {
            this.onNotConnected?.(event.data);
            return;
          }
          // @ts-ignore Controller[method] should be callable here
          const result = await DeviceController[method](params)(sessionId);
          window.parent.postMessage({ id, result }, window.location.origin);
        } catch (error) {
          window.parent.postMessage(
            { id, error: normalizeDeviceError(getError(error)) },
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
  }: {
    onNotConnected?: (
      message: Omit<RpcRequest, 'id'> & { id?: string }
    ) => void;
  } = {}) {
    this.onNotConnected = onNotConnected;
    window.addEventListener('message', this.listener);
    return () => {
      window.removeEventListener('message', this.listener);
    };
  }
}

export function SignConnector() {
  const [interruptedRequest, setInterruptedRequest] = useState<
    (Omit<RpcRequest, 'id'> & { id?: string }) | null
  >(null);
  const [controller] = useState(() => new DeviceController());
  useEffect(() => {
    return controller.listen({
      onNotConnected: setInterruptedRequest,
    });
  }, [controller]);
  const { mutate } = useMutation({
    mutationFn: async (transport: TransportIdentifier) => {
      const { sessionId } = await connectDevice({
        transportIdentifier: transport,
      });
      window.postMessage({ ...interruptedRequest, transport, sessionId });
      setInterruptedRequest(null);
    },
  });
  return interruptedRequest ? (
    <VStack gap={4}>
      <Button onClick={() => mutate(transports.hid)}>Usb</Button>
      <Button onClick={() => mutate(transports.bluetooth)}>Bluetooth</Button>
    </VStack>
  ) : (
    <div>Hello</div>
  );
}
