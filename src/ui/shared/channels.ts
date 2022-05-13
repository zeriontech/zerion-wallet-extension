import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { Wallet } from 'src/shared/types/Wallet';
import type { AccountPublicRPC } from 'src/shared/types/AccountPublicRPC';
import { formatJsonRpcResultForPort } from 'src/shared/formatJsonRpcResultForPort';
import { formatJsonRpcError } from '@json-rpc-tools/utils';
import { UserRejected } from 'src/shared/errors/UserRejected';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SomeMethod = (...args: any) => any;

type RPCPort<Implementation> = Omit<PortMessageChannel, 'request'> & {
  request<T extends keyof Implementation, Method = Implementation[T]>(
    method: T,
    ...params: Method extends SomeMethod
      ? Omit<Parameters<Method>[0], 'context'> extends {
          params: unknown;
        }
        ? [
            params: Omit<Parameters<Method>[0], 'context'>['params'],
            id?: number
          ]
        : [params?: undefined, id?: number]
      : [never]
  ): // params: Method extends SomeMethod
  //   ? Omit<Parameters<Method>[0], 'context'> extends {
  //       params: unknown;
  //     }
  //     ? Omit<Parameters<Method>[0], 'context'>['params']
  //     : undefined
  //   : never,
  // id?: number
  Method extends SomeMethod ? ReturnType<Method> : never;
};

export const walletPort = new PortMessageChannel({
  name: 'wallet',
}) as RPCPort<Wallet>;

export const accountPublicRPCPort = new PortMessageChannel({
  name: 'accountPublicRPC',
}) as RPCPort<AccountPublicRPC>;

class WindowPort extends PortMessageChannel {
  confirm<T>(windowId: number, result?: T) {
    return this.port.postMessage(formatJsonRpcResultForPort(windowId, result));
  }

  reject(windowId: number) {
    this.port.postMessage(formatJsonRpcError(windowId, new UserRejected()));
  }
}

export const windowPort = new WindowPort({ name: 'window' });
