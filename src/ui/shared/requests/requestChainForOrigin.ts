import { createChain } from 'src/modules/networks/Chain';
import { walletPort } from 'src/ui/shared/channels';

export function requestChainForOrigin(tabOrigin?: string) {
  return tabOrigin
    ? walletPort
        .request('requestChainForOrigin', { origin: tabOrigin })
        .then((chain) => createChain(chain))
    : null;
}
