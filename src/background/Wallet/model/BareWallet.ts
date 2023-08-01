import type { ethers } from 'ethers';
import type { ExternallyOwnedAccount } from './accounts/types';

export interface BareWallet extends ExternallyOwnedAccount {
  mnemonic: { phrase: string; path: string } | null;
  privateKey: ethers.Wallet['privateKey'];
}
