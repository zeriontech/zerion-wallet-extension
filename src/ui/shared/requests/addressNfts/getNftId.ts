import type { NFT } from './types';

export function getNftId(
  nft: Pick<NFT, 'chain' | 'contract_address' | 'token_id'>
) {
  return `${nft.chain}:${nft.contract_address}:${nft.token_id}`;
}
