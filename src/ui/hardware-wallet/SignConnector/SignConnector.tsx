import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  checkDevice,
  signTransaction,
  personalSign,
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
import { normalizeDeviceError } from '../shared/errors';
import {
  assertPersonalSignParams,
  assertSignTransactionParams,
  assertSignTypedData_v4Params,
} from './helpers';

export class DeviceController {
  private emitter = createNanoEvents<{
    message: (msg: unknown) => void;
  }>();

  static async signTransaction(params: unknown) {
    await checkDevice();
    assertSignTransactionParams(params);
    // @ts-ignore params.transaction is object
    return signTransaction(params.derivationPath, params.transaction);
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
