import type { AddressNFT } from 'src/ui/shared/requests/addressNfts/types';

export function getNftEntityUrl(nft: AddressNFT) {
  return `/nft/${nft.chain}/${nft.contract_address}:${nft.token_id}`;
}
