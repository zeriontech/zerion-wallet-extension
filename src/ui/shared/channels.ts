import browser from 'webextension-polyfill';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { Wallet } from 'src/shared/types/Wallet';
import type { AccountPublicRPC } from 'src/shared/types/AccountPublicRPC';
import type { MemoryCacheRPC } from 'src/shared/types/MemoryCacheRPC';
import { UserRejected } from 'src/shared/errors/errors';
import type { RpcRequestWithContext } from 'src/shared/custom-rpc';
import type { DnaService } from '../components/DnaClaim/dna.background';
import { initDnaApi } from '../components/DnaClaim/dna.client';
import { QueryService } from './requests/queries/queryClient.background';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SomeMethod = (...args: any) => Promise<any>;

type RPCPort<Implementation> = Omit<PortMessageChannel, 'request'> & {
  request<
    T extends string,
    Method = T extends keyof Implementation
      ? Implementation[T] extends SomeMethod
        ? Implementation[T]
        : never
      : never
  >(
    method: Method extends SomeMethod ? T : never,
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
  ): Method extends SomeMethod ? ReturnType<Method> : never;
};

export const walletPort = new PortMessageChannel({
  name: `${browser.runtime.id}/wallet`,
}) as RPCPort<Wallet>;

type BlockTag = 'latest' | 'earliest' | 'pending';
interface NodeMethods {
  eth_getBalance(
    request: RpcRequestWithContext<[string, BlockTag]>
  ): Promise<string>;
}

export const httpConnectionPort = new PortMessageChannel({
  name: `${browser.runtime.id}/http-connection-ui`,
}) as RPCPort<NodeMethods>;

export const accountPublicRPCPort = new PortMessageChannel({
  name: 'accountPublicRPC',
}) as RPCPort<AccountPublicRPC>;

export const memoryCacheRPCPort = new PortMessageChannel({
  name: 'memoryCacheRPC',
}) as RPCPort<MemoryCacheRPC>;

export const dnaServicePort = new PortMessageChannel({
  name: 'dnaService',
}) as RPCPort<DnaService>;

export const queryServicePort = new PortMessageChannel({
  name: 'queryService',
}) as RPCPort<QueryService>;

class WindowPort extends PortMessageChannel {
  confirm<T>(
    windowId: string,
    // result MUST NOT be undefined, otherwise the payload will not be interpreter
    // as JsonRpcResult or RpcResult, because `undefined` propertires get removed
    // when sent via ports
    result: T
  ) {
    return this.port?.postMessage({
      id: windowId,
      result,
    });
  }

  reject(windowId: string) {
    this.port?.postMessage({
      id: windowId,
      error: new UserRejected(),
    });
  }
}

export const windowPort = new WindowPort({ name: 'window' });

export function initialize() {
  walletPort.initialize();
  httpConnectionPort.initialize();
  accountPublicRPCPort.initialize();
  memoryCacheRPCPort.initialize();
  windowPort.initialize();
  dnaServicePort.initialize();
  queryServicePort.initialize();
  initDnaApi();
}
