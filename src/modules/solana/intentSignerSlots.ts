import type { Keypair } from '@solana/web3.js';
import {
  PublicKey,
  SIGNATURE_LENGTH_IN_BYTES,
  VersionedTransaction,
} from '@solana/web3.js';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'src/modules/crypto';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { isSolanaAddress } from './shared';

export class IntentSignerSlotError extends Error {
  name = 'IntentSignerSlotError';
}

function fromBase64(transaction: string) {
  return VersionedTransaction.deserialize(base64ToUint8Array(transaction));
}

/** Index of the signature slot `address` must fill */
function getSignerIndex(transaction: VersionedTransaction, address: string) {
  const { staticAccountKeys, header } = transaction.message;
  const publicKey = isSolanaAddress(address) ? new PublicKey(address) : null;
  const index = publicKey
    ? staticAccountKeys
        .slice(0, header.numRequiredSignatures)
        .findIndex((signer) => signer.equals(publicKey))
    : -1;
  if (index === -1) {
    throw new IntentSignerSlotError(
      `Solana address ${address} is not a required signer of this transaction`
    );
  }
  return index;
}

export function assertSolSigner(transaction: string, address: string) {
  getSignerIndex(fromBase64(transaction), address);
}

function isSameBytes(a: Uint8Array, b: Uint8Array) {
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

/** The returned transaction is the sent one with only the slot of `address` filled */
export function assertSolTransactionSignedBy(
  sent: string,
  returned: string,
  address: string
) {
  const sentTransaction = fromBase64(sent);
  const returnedTransaction = fromBase64(returned);
  if (
    !isSameBytes(
      sentTransaction.message.serialize(),
      returnedTransaction.message.serialize()
    )
  ) {
    throw new IntentSignerSlotError(
      'The signer returned a different Solana transaction than the one sent for signing'
    );
  }
  const signerIndex = getSignerIndex(sentTransaction, address);
  const sentSlots = sentTransaction.signatures;
  const returnedSlots = returnedTransaction.signatures;
  const otherSlotsUnchanged =
    sentSlots.length === returnedSlots.length &&
    sentSlots.every(
      (slot, index) =>
        index === signerIndex || isSameBytes(slot, returnedSlots[index])
    );
  if (!otherSlotsUnchanged) {
    throw new IntentSignerSlotError(
      'The signer returned a Solana transaction with a changed signature from another signer'
    );
  }
  const signerSlot = returnedSlots[signerIndex];
  if (
    signerSlot.length !== SIGNATURE_LENGTH_IN_BYTES ||
    signerSlot.every((byte) => byte === 0)
  ) {
    throw new IntentSignerSlotError(
      `The signer returned a Solana transaction without a signature from ${address}`
    );
  }
}

export function signIntentSolanaTransaction(
  transaction: string,
  keypair: Keypair
): StringBase64 {
  const address = keypair.publicKey.toBase58();
  const decoded = fromBase64(transaction);
  getSignerIndex(decoded, address);
  decoded.sign([keypair]);
  const signed = uint8ArrayToBase64(decoded.serialize()) as StringBase64;
  assertSolTransactionSignedBy(transaction, signed, address);
  return signed;
}
