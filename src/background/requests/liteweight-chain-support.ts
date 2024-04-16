import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { WalletOrigin } from 'src/shared/WalletOrigin';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import { emitter } from '../events';
import type { Account } from '../account/Account';

function registerChainAndAddressIfPossible(
  chain: string,
  address: string | null
) {
  if (address && !isCustomNetworkId(chain.toString())) {
    ZerionAPI.registerChain({
      chain: chain.toString(),
      addresses: [normalizeAddress(address)],
    });
  }
}

export function initialize(account: Account) {
  // Backend needs this event to initialize chain listening for the address in case the chain is not fully supported
  emitter.on('chainChanged', async (chain) => {
    const address = account.getCurrentWallet().readCurrentAddress();
    registerChainAndAddressIfPossible(chain.toString(), address);
  });

  // Backend needs this event to initialize chain listening for the address in case the chain is not fully supported
  emitter.on('dappConnection', async ({ origin, address }) => {
    const chainId = await account
      .getCurrentWallet()
      .getChainIdForOrigin({ origin });
    if (!chainId) {
      return;
    }
    const networks = await networksStore.loadNetworksWithChainId(chainId);
    const network = networks.getNetworkById(chainId);
    registerChainAndAddressIfPossible(network.id, address);
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
