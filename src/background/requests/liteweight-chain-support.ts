import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { WalletOrigin } from 'src/shared/WalletOrigin';
import { fetchNetworkByChainId } from 'src/modules/networks/networks-store.background';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { Chain } from 'src/modules/networks/Chain';
import { emitter } from '../events';
import type { Account } from '../account/Account';
import { INTERNAL_SYMBOL_CONTEXT } from '../Wallet/Wallet';

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
  function registerChain(chain: Chain) {
    const address = account.getCurrentWallet().readCurrentAddress();
    registerChainAndAddressIfPossible(chain.toString(), address);
  }
  // Backend needs these events to initialize chain listening for the address in case the chain is not fully supported
  emitter.on('chainChanged', registerChain);
  emitter.on('ui:chainSelected', registerChain);
  emitter.on(
    'requestAccountsResolved',
    async ({ origin, address, explicitly }) => {
      if (!explicitly) {
        return;
      }
      const chainId = await account
        .getCurrentWallet()
        .getChainIdForOrigin({ origin });
      if (!chainId) {
        return;
      }
      const preferences = await account
        .getCurrentWallet()
        .getPreferences({ context: INTERNAL_SYMBOL_CONTEXT });
      const network = await fetchNetworkByChainId({
        chainId,
        preferences,
        apiEnv: 'testnet-first',
      });
      if (network) {
        registerChainAndAddressIfPossible(network.id, address);
      }
    }
  );

  // Backend needs this event to initialize address listening for chains without total support
  emitter.on('walletCreated', async ({ walletContainer, origin }) => {
    if (origin === WalletOrigin.imported) {
      ZerionAPI.registerAddresses({
        addresses: walletContainer.wallets.map((wallet) => wallet.address),
      });
    }
  });
}
