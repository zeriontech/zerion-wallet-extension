import { UnsupportedNetwork } from 'src/modules/networks/errors';
import type { Networks } from 'src/modules/networks/Networks';
import type { ChainId } from './ChainId';

export function wrappedGetNetworkById(networks: Networks, chainId: ChainId) {
  try {
    return networks.getNetworkById(chainId);
  } catch (error) {
    if (error instanceof UnsupportedNetwork) {
      throw new Error(
        `No network configuration found for ${chainId}.\nYou can add a custom network in the "Settings -> Networks" section.`
      );
    } else {
      throw error;
    }
  }
}
