import type { ethers } from 'ethers';
import type { ExternallyOwnedAccount } from './AccountContainer';

// TODO: rename BareWallet to SignerWallet?
export interface BareWallet extends ExternallyOwnedAccount {
  mnemonic: { phrase: string; path: string } | null;
  privateKey: ethers.Wallet['privateKey'];
}
