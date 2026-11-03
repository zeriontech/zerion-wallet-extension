import type { ethers } from 'ethers';
import type { Keypair } from '@solana/web3.js';
import type { IntentMultichain } from 'src/shared/types/Quote';
import { InvalidParams } from 'src/shared/errors/errors';
import { prepareTypedDataForSigning } from 'src/modules/ethereum/message-signing/prepareTypedDataForSigning';
import { signTypedData } from 'src/modules/ethereum/message-signing/signTypedData';
import { signIntentSolanaTransaction } from 'src/modules/solana/intentSignerSlots';

/** 0x-hex EIP-712 signature for an EVM intent, base64 signed transaction for a Solana one */
export async function signSwapIntentPayload(
  intent: IntentMultichain,
  keys: {
    getEvmSigner: () => ethers.Wallet;
    getSolanaKeypair: () => Keypair;
  }
): Promise<string> {
  if (intent.evm) {
    return signTypedData(
      prepareTypedDataForSigning(intent.evm),
      keys.getEvmSigner()
    );
  }
  if (intent.solana) {
    return signIntentSolanaTransaction(intent.solana, keys.getSolanaKeypair());
  }
  throw new InvalidParams();
}
