import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import {
  getBackendNetworkByChainId,
  getBackendNetworkByLocalChain,
} from 'src/modules/networks/getBackendNetwork';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { emitter } from '../events';
import type { Account } from '../account/Account';

export function initialize(account: Account) {
  function listenForChainChange() {
    account.getCurrentWallet().emitter.on('chainChanged', async (chain) => {
      const network = await getBackendNetworkByLocalChain(chain);
      const address = account.getCurrentWallet().readCurrentAddress();
      if (network && address) {
        ZerionAPI.registerChain({
          chain: network.id,
          addresses: [normalizeAddress(address)],
        });
      }
    });
  }
  listenForChainChange();
  // update subscription on Wallet recreation inside Account
  account.on('reset', () => {
    listenForChainChange();
  });

  emitter.on('dappConnection', async ({ origin, address }) => {
    const chainId = await account
      .getCurrentWallet()
      .getChainIdForOrigin({ origin });
    const network = await getBackendNetworkByChainId(chainId);
    if (address && network) {
      ZerionAPI.registerChain({
        chain: network.id,
        addresses: [normalizeAddress(address)],
      });
    }
  });
}
