// import { ethers } from 'ethers';

const next = (index: number) => `m/44'/60'/0'/0/${index}`;

export const getAccountPath = next;

export type DerivationPathType = 'bip44' | 'ledger' | 'ledgerLive';

// As per https://github.com/ethereum/EIPs/issues/84#issuecomment-517505282:
// m/44'/60'/0'/0/x: BIP44, MetaMask, Jaxx, MyEtherWallet (default), TREZOR App, Exodus
// m/44'/60'/x'/0/0: BIP44, KeepKey, MetaMask (custom), Ledger Live
// m/44'/60'/0'/x: Electrum, MyEtherWallet (ledger), Ledger Chrome App, imToken

const pathPatterns: Record<DerivationPathType, RegExp> = {
  bip44: /m\/44'\/60'\/0'\/0\/(\d+)/,
  ledgerLive: /m\/44'\/60'\/(\d+)'\/0\/0/,
  ledger: /m\/44'\/60'\/0'\/(\d+)/,
};

export function getIndexFromPath(
  path: string,
  type: DerivationPathType = 'bip44'
) {
  const pattern = pathPatterns[type];
  const digits = path.match(pattern)?.[1];
  return digits ? Number(digits) : 0;
}

// export function getNextAccountPath(
//   path: string,
//   type: DerivationPathType = 'bip44'
// ) {
//   const pattern = pathPatterns[type]
//   const match = path.match(pattern);
//   if (match) {
//     return next(Number(match[1]) + 1);
//   } else {
//     return ethers.utils.defaultPath;
//   }
// }
