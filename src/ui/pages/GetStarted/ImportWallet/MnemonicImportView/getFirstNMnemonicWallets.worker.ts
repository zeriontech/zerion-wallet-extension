import { ethers } from 'ethers';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { getAccountPath } from 'src/shared/wallet/getNextAccountPath';

export interface Params {
  phrase: string;
  n: number;
}

export type Result = BareWallet[];

function fromHDNode(hdNode: ethers.utils.HDNode): BareWallet {
  if (!hdNode.mnemonic) {
    throw new Error('Expected an HDNode with a mnemonic');
  }
  return {
    mnemonic: hdNode.mnemonic,
    privateKey: hdNode.privateKey,
    address: hdNode.address,
    name: null,
  };
}

function getFirstNMnemonicWallets({ phrase, n }: Params) {
  const result: Result = [];
  // NOTE:
  // ethers.utils.HDNode is _much_ faster at generating wallets
  // than ethers.Wallet
  const hd = ethers.utils.HDNode.fromMnemonic(phrase);
  for (let i = 0; i < n; i++) {
    const path = getAccountPath(i);
    const wallet = hd.derivePath(path);
    result.push(fromHDNode(wallet));
  }
  return result;
}

global.onmessage = (event: MessageEvent<Params>) => {
  const { phrase, n } = event.data;
  const result = getFirstNMnemonicWallets({ phrase, n });
  global.postMessage(result);
};
