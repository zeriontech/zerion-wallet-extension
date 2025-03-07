// As per https://github.com/ethereum/EIPs/issues/84#issuecomment-517505282:
// m/44'/60'/0'/0/x: BIP44, MetaMask, Jaxx, MyEtherWallet (default), TREZOR App, Exodus
// m/44'/60'/x'/0/0: BIP44, KeepKey, MetaMask (custom), Ledger Live
// m/44'/60'/0'/x: Electrum, MyEtherWallet (ledger), Ledger Chrome App, imToken

const pathPatterns = {
  bip44: {
    regex: /(?:m\/)?44'\/60'\/0'\/0\/(\d+)/,
    fromIndex: (index: number) => `m/44'/60'/0'/0/${index}`,
  },
  ledgerLive: {
    regex: /(?:m\/)?44'\/60'\/(\d+)'\/0\/0/,
    fromIndex: (index: number) => `m/44'/60'/${index}'/0/0`,
  },
  ledger: {
    regex: /(?:m\/)?44'\/60'\/0'\/(\d+)/,
    fromIndex: (index: number) => `m/44'/60'/0'/${index}`,
  },
  /**
   * Default solana path
   * More info: https://help.phantom.com/hc/en-us/articles/12988493966227-What-derivation-paths-does-Phantom-wallet-support
   */
  solanaBip44Change: {
    regex: /(?:m\/)?44'\/501'\/(\d+)'\/0'/,
    fromIndex: (index: number) => `m/44'/501'/${index}'/0'`,
  },
  solanaBip44: {
    regex: /(?:m\/)?44'\/501'\/(\d+)'/,
    fromIndex: (index: number) => `m/44'/501'/${index}'`,
  },
  solanaDeprecated: {
    regex: /(?:m\/)?501'\/(\d+)'\/0'\/0'/,
    fromIndex: (index: number) => `m/501'/${index}'/0'/0'`,
  },
} satisfies Record<
  string,
  { regex: RegExp; fromIndex: (index: number) => string }
>;

export type DerivationPathType = keyof typeof pathPatterns;

/** Default account paths used for Ethereum wallets */
export const getAccountPathEthereum = (index: number) =>
  pathPatterns.bip44.fromIndex(index);

/** This isn't the most elegant, but we can determine solana addresses based on derivation path */
export function isSolanaPath(path: string) {
  return (
    pathPatterns.solanaBip44Change.regex.test(path) ||
    pathPatterns.solanaBip44.regex.test(path) ||
    pathPatterns.solanaDeprecated.regex.test(path)
  );
}

export const getAccountPath = (pathType: DerivationPathType, index: number) => {
  return pathPatterns[pathType].fromIndex(index);
};

export function getIndexFromPath(
  path: string,
  type: DerivationPathType = 'bip44'
) {
  const pattern = pathPatterns[type];
  const digits = path.match(pattern.regex)?.[1];
  return digits ? Number(digits) : 0;
}

export function inferIndexFromDerivationPath(path: string) {
  for (const pattern of Object.values(pathPatterns)) {
    const match = path.match(pattern.regex);
    if (match) {
      return Number(match[1]);
    }
  }
  return 0;
}
