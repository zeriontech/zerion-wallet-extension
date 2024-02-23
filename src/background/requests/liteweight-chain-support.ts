import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import {
  getBackendNetworkByChainId,
  getBackendNetworkByLocalChain,
} from 'src/modules/networks/getBackendNetwork';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { WalletOrigin } from 'src/shared/WalletOrigin';
import { emitter } from '../events';
import type { Account } from '../account/Account';

export function initialize(account: Account) {
  // Backend needs this event to initialize chain listening for the address in case the chain is not fully supported
  emitter.on('chainChanged', async (chain) => {
    const network = await getBackendNetworkByLocalChain(chain);
    const address = account.getCurrentWallet().readCurrentAddress();
    if (network && address) {
      ZerionAPI.registerChain({
        chain: network.id,
        addresses: [normalizeAddress(address)],
      });
    }
  });

  // Backend needs this event to initialize chain listening for the address in case the chain is not fully supported
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

  // Backend needs this event to initialize address listening for chains without total support
  emitter.on('walletCreated', async ({ walletContainer, origin }) => {
    if (origin === WalletOrigin.imported) {
      ZerionAPI.registerAddresses({
        addresses: walletContainer.wallets.map((wallet) => wallet.address),
      });
    }
  });
}
