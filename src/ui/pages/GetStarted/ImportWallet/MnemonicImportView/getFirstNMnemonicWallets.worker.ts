import { HDNode } from '@ethersproject/hdnode';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import { getAccountPath } from 'src/shared/wallet/derivation-paths';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import {
  decodeMasked,
  encodeForMasking,
} from 'src/shared/wallet/encode-locally';

export interface Params {
  phrase: LocallyEncoded;
  n: number;
}

export type Result = MaskedBareWallet[];

function fromHDNode(hdNode: HDNode): MaskedBareWallet {
  if (!hdNode.mnemonic) {
    throw new Error('Expected an HDNode with a mnemonic');
  }
  return {
    mnemonic: {
      ...hdNode.mnemonic,
      phrase: encodeForMasking(hdNode.mnemonic.phrase),
    },
    privateKey: encodeForMasking(hdNode.privateKey),
    address: hdNode.address,
    name: null,
  };
}

function getFirstNMnemonicWallets({ phrase, n }: Params) {
  const result: Result = [];
  // NOTE:
  // ethers.utils.HDNode is _much_ faster at generating wallets
  // than ethers.Wallet
  const hd = HDNode.fromMnemonic(decodeMasked(phrase));
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
