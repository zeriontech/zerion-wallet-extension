import { ethers } from 'ethers';
import type { BareMnemonicWallet } from 'src/shared/types/BareWallet';
import { hasOnlySpaceSeparators } from 'src/shared/validation/wallet';
import { invariant } from '../invariant';
import { getAccountPathEthereum } from './derivation-paths';

/** The first `n` EVM accounts of a recovery phrase, in derivation-path order */
export function deriveEthereumWallets(phrase: string, n: number): BareMnemonicWallet[] {
  invariant(hasOnlySpaceSeparators(phrase), 'Expected space-separated words');
  // Build the root node once: turning the phrase into a seed is the slow part
  const root = ethers.HDNodeWallet.fromPhrase(phrase, undefined, 'm');
  const result: BareMnemonicWallet[] = [];
  for (let i = 0; i < n; i++) {
    const path = getAccountPathEthereum(i);
    const node = root.derivePath(path);
    if (!node.mnemonic) {
      throw new Error('Expected a derived node with a mnemonic');
    }
    result.push({
      mnemonic: { phrase: node.mnemonic.phrase, path },
      privateKey: node.privateKey,
      address: node.address,
      name: null,
    });
  }
  return result;
}
