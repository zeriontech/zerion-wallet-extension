import type { NFT } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';

export function getNftEntityUrl(nft: NFT) {
  return `/nft/${nft.chain}/${nft.contractAddress}:${nft.tokenId}`;
}
