import type { ethers } from 'ethers';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';

export interface SignerObject {
  mnemonic: { phrase: string; path: string } | null;
  privateKey: ethers.Wallet['privateKey'];
}

export interface MaskedSignerObject {
  mnemonic: { phrase: LocallyEncoded; path: string } | null;
  privateKey: LocallyEncoded;
}
