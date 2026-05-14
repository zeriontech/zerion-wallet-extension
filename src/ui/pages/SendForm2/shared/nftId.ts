/**
 * NFT id follows the ZPI scheme: `${chain}:${contractAddress}:${tokenId}`.
 * Example: `ethereum:0x932261f9fc8da46c4a22e31b45c4de60623848bf:5555`.
 */

export interface ParsedNftId {
  chain: string;
  contractAddress: string;
  tokenId: string;
}

export function parseNftId(id: string): ParsedNftId | null {
  const parts = id.split(':');
  if (parts.length < 3) return null;
  const [chain, contractAddress, ...rest] = parts;
  if (!chain || !contractAddress || rest.length === 0) return null;
  return { chain, contractAddress, tokenId: rest.join(':') };
}

export function createNftId({
  chain,
  contractAddress,
  tokenId,
}: ParsedNftId): string {
  return `${chain}:${contractAddress}:${tokenId}`;
}
