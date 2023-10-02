import { useEffect, useState } from 'react';
import {
  checkDevice,
  signTransaction,
} from '@zeriontech/hardware-wallet-connection';
import { isObj } from 'src/shared/isObj';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { isClassProperty } from 'src/shared/core/isClassProperty';

interface SignTransactionParams {
  derivationPath: string;
  transaction: object;
}

function assertSignTransactionParams(
  x: unknown
): asserts x is SignTransactionParams {
  if (
    isObj(x) &&
    typeof x.derivationPath === 'string' &&
    isObj(x.transaction)
  ) {
    // ok
  } else {
    throw new Error('Invalid Payload');
  }
}

class Controller {
  static async signTransaction(params: unknown) {
    await checkDevice();
    assertSignTransactionParams(params);
    // @ts-ignore params.transaction is object
    return signTransaction(params.derivationPath, params.transaction);
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
          window.parent.postMessage({ id, error }, window.location.origin);
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

export function SignTransaction() {
  const [controller] = useState(() => new Controller());
  useEffect(() => {
    return controller.listen();
  }, [controller]);
  return null;
}
