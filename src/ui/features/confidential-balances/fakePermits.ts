import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';

const FAKE_CHAINS: { chain: string; chainId: string }[] = [
  { chain: 'ethereum', chainId: '0x1' },
  { chain: 'base', chainId: '0x2105' },
  { chain: 'arbitrum', chainId: '0xa4b1' },
];
const FAKE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Dev-menu stand-in for `wallet/prepare-permits/v1`: three well-formed EIP-712
 * permits the wallet will sign. Nothing about them is accepted by the backend
 * — they only drive the signing, storage and refetch paths before it ships.
 */
export function createFakePermits(address: string): Permit[] {
  const expireAt = new Date(Date.now() + FAKE_LIFETIME_MS).toISOString();
  return FAKE_CHAINS.map(({ chain, chainId }, index) => {
    const contract = `0x${String(index + 1).padStart(40, '0')}`;
    return {
      chain,
      contracts: [contract],
      expireAt,
      eip712: {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          DecryptionPermit: [
            { name: 'holder', type: 'address' },
            { name: 'contracts', type: 'address[]' },
            { name: 'expiresAt', type: 'uint256' },
          ],
        },
        primaryType: 'DecryptionPermit',
        domain: {
          name: 'Zerion Confidential Balances (dev)',
          version: '1',
          chainId,
          verifyingContract: contract,
          salt: null,
        },
        message: {
          holder: address,
          contracts: [contract],
          expiresAt: Math.floor(Date.parse(expireAt) / 1000),
        },
      },
    };
  });
}
