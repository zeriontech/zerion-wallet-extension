import browser from 'webextension-polyfill';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { Wallet } from 'src/shared/types/Wallet';
import type { AccountPublicRPC } from 'src/shared/types/AccountPublicRPC';
import type { MemoryCacheRPC } from 'src/shared/types/MemoryCacheRPC';
import { UserRejected } from 'src/shared/errors/errors';
import type { RpcRequestWithContext } from 'src/shared/custom-rpc';
import type { DnaService } from '../../modules/dna-service/dna.background';
import { initDnaApi } from '../../modules/dna-service/dna.client';
import type { SessionCacheService } from '../../background/resource/sessionCacheService';
import type { RPCPort } from './channels.types';

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

export const sessionCacheService = new PortMessageChannel({
  name: 'sessionCacheService',
}) as RPCPort<SessionCacheService>;

class WindowPort extends PortMessageChannel {
  confirm<T>(
    windowId: string,
    // result MUST NOT be undefined, otherwise the payload will not be interpreter
    // as JsonRpcResult or RpcResult, because `undefined` properties get removed
    // when sent via ports
    result: T
  ) {
    return this.request('resolve', [{ windowId, result }]);
  }

  reject(windowId: string) {
    return this.request('reject', [{ windowId, error: new UserRejected() }]);
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
  sessionCacheService.initialize();
  initDnaApi();
}
