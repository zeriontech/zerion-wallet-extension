import type { AddressNFT } from 'src/defi-sdk.types';

export function getNftEntityUrl(nft: AddressNFT) {
  return `/nft/${nft.chain}/${nft.contract_address}:${nft.token_id}`;
}
