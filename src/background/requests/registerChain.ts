import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import {
  getBackendNetworkByChainId,
  getBackendNetworkByLocalChain,
} from 'src/modules/networks/getBackendNetwork';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { Wallet } from '../Wallet/Wallet';
import { emitter } from '../events';

export function initialize(wallet: Wallet) {
  wallet.emitter.on('chainChanged', async (chain) => {
    const network = await getBackendNetworkByLocalChain(chain);
    const address = wallet.readCurrentAddress();
    if (network && address) {
      ZerionAPI.registerChain({
        chain: network.id,
        address: normalizeAddress(address),
      });
    }
  });
  emitter.on('dappConnection', async ({ origin, address }) => {
    const chainId = await wallet.getChainIdForOrigin({ origin });
    const network = await getBackendNetworkByChainId(chainId);
    if (address && network) {
      ZerionAPI.registerChain({
        chain: network.id,
        address: normalizeAddress(address),
      });
    }
  });
}
