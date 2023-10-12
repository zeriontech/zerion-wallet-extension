import { useEffect, useState } from 'react';
import {
  checkDevice,
  signTransaction,
  personalSign,
  signTypedData_v4,
} from '@zeriontech/hardware-wallet-connection';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import { getError } from 'src/shared/errors/getError';
import { normalizeDeviceError } from '../shared/errors';
import {
  assertPersonalSignParams,
  assertSignTransactionParams,
  assertSignTypedData_v4Params,
} from './helpers';

class Controller {
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

  static async listener(event: MessageEvent) {
    if (isRpcRequest(event.data)) {
      const { id, method, params } = event.data;
      if (
        isClassProperty(Controller, method) &&
        typeof Controller[method] === 'function'
      ) {
        try {
          // @ts-ignore Controller[method] should be callable here
          const result = await Controller[method](params);
          window.parent.postMessage({ id, result }, window.location.origin);
        } catch (error) {
          window.parent.postMessage(
            { id, error: normalizeDeviceError(getError(error)) },
            window.location.origin
          );
        }
      }
    }
  }

  listen() {
    window.addEventListener('message', Controller.listener);
    return () => {
      window.removeEventListener('message', Controller.listener);
    };
  }
}

export function SignConnector() {
  const [controller] = useState(() => new Controller());
  useEffect(() => {
    return controller.listen();
  }, [controller]);
  return null;
}
