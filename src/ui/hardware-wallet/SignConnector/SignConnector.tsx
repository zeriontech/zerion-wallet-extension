import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  checkDevice,
  signTransaction,
  personalSign,
  signSolanaTransaction,
  signTypedData_v4,
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
import {
  base64ToArrayBuffer,
  base64ToUint8Array,
  uint8ArrayToBase64,
} from 'src/modules/crypto';
import { Transaction } from '@solana/web3.js';
import { normalizeDeviceError } from '../shared/errors';
import {
  assertPersonalSignParams,
  assertSignSolanaTransactionParams,
  assertSignTransactionParams,
  assertSignTypedData_v4Params,
} from './helpers';
// import { StringBase64 } from 'src/shared/types/StringBase64';
// import { StringBase64 } from 'src/shared/types/StringBase64';

export class DeviceController {
  private emitter = createNanoEvents<{
    message: (msg: unknown) => void;
  }>();

  static async signTransaction(params: unknown) {
    const { sessionId } = await checkDevice();
    assertSignTransactionParams(params);
    // @ts-ignore params.transaction is object
    return signTransaction(
      params.derivationPath,
      params.transaction,
      sessionId
    );
  }

  static async solana_signTransaction(params: unknown) {
    const { sessionId } = await checkDevice();
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
  }

  static async personalSign(params: unknown) {
    await checkDevice();
    assertPersonalSignParams(params);
    return personalSign(params.derivationPath, params.message);
  }

  static async signTypedData_v4(params: unknown) {
    await checkDevice();
    assertSignTypedData_v4Params(params);
    // @ts-ignore params.typedData is object
    return signTypedData_v4(params.derivationPath, params.typedData);
  }

  listener = async (event: MessageEvent) => {
    console.log('SignConnector received message', event.data);
    if (isRpcRequest(event.data)) {
      const { id, method, params } = event.data;
      if (
        isClassProperty(DeviceController, method) &&
        typeof DeviceController[method] === 'function'
      ) {
        try {
          // @ts-ignore Controller[method] should be callable here
          const result = await DeviceController[method](params);
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

  listen() {
    window.addEventListener('message', this.listener);
    return () => {
      window.removeEventListener('message', this.listener);
    };
  }
}

export function SignConnector() {
  const [controller] = useState(() => new DeviceController());
  useEffect(() => {
    return controller.listen();
  }, [controller]);
  return null;
}
