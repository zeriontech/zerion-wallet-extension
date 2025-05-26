import { getChainWithMostAssetValue } from '@zeriontech/transactions';
import type { AddressPosition } from 'defi-sdk';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { isSolanaAddress } from 'src/modules/solana/shared';

export function getDefaultChain(address: string, positions: AddressPosition[]) {
  const chain = getChainWithMostAssetValue(positions ?? []);
  if (chain) {
    return chain;
  } else {
    return isSolanaAddress(address) ? NetworkId.Solana : NetworkId.Ethereum;
  }
}
