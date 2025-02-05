const next = (index: number) => `m/44'/60'/0'/0/${index}`;

export const getAccountPath = next;

export type DerivationPathType = 'bip44' | 'ledger' | 'ledgerLive' | 'solana';

// As per https://github.com/ethereum/EIPs/issues/84#issuecomment-517505282:
// m/44'/60'/0'/0/x: BIP44, MetaMask, Jaxx, MyEtherWallet (default), TREZOR App, Exodus
// m/44'/60'/x'/0/0: BIP44, KeepKey, MetaMask (custom), Ledger Live
// m/44'/60'/0'/x: Electrum, MyEtherWallet (ledger), Ledger Chrome App, imToken

const pathPatterns: Record<DerivationPathType, RegExp> = {
  bip44: /(?:m\/)?44'\/60'\/0'\/0\/(\d+)/,
  ledgerLive: /(?:m\/)?44'\/60'\/(\d+)'\/0\/0/,
  ledger: /(?:m\/)?44'\/60'\/0'\/(\d+)/,
  solana: /(?:m\/)?44'\/501'\/0'\/(\d+)'/,
};

/** This isn't the most elegant, but we can determine solana addresses based on derivation path */
export function isSolanaPath(path: string) {
  return pathPatterns.solana.test(path);
}

export const getAccountPathSolana = (index: number) =>
  `m/44'/501'/0'/${index}'`;

export function getIndexFromPath(
  path: string,
  type: DerivationPathType = 'bip44'
) {
  const pattern = pathPatterns[type];
  const digits = path.match(pattern)?.[1];
  return digits ? Number(digits) : 0;
}

export function inferIndexFromDerivationPath(path: string) {
  for (const pattern of Object.values(pathPatterns)) {
    const match = path.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }
  return 0;
}
