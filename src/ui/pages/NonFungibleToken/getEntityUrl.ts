import type { AddressNFT } from 'defi-sdk';

export function getNftEntityUrl(nft: AddressNFT) {
  return `/nft/${nft.chain}/${nft.contract_address}:${nft.token_id}`;
}
