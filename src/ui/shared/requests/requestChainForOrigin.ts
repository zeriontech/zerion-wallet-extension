import { createChain } from 'src/modules/networks/Chain';
import { walletPort } from '../channels';

export function requestChainForOrigin(tabOrigin?: string) {
  return tabOrigin
    ? walletPort
        .request('requestChainForOrigin', {
          origin: tabOrigin,
        })
        .then((chain) => createChain(chain))
    : null;
}
