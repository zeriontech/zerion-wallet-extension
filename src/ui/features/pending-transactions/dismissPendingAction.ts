import bs58 from 'bs58';
import { ethers } from 'ethers';
import { base64ToUint8Array } from 'src/modules/crypto/convert';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { DismissActionProof } from 'src/modules/zerion-api/requests/transaction-dismiss-action';
import type { MessageContextParams } from 'src/shared/types/SignatureContextParams';
import {
  SignLockBusyError,
  SignLockCancelledError,
  untilAborted,
  type SignLock,
} from './signLock';

export const DISMISS_PROOF_TTL_SECONDS = 3600;

const SOLANA_SIGNATURE_LENGTH = 64;

/** TBG's dismiss caption (`internal/action/dismiss.go`), byte for byte */
export function getDismissMessage(actionId: string, expireAt: number): string {
  return (
    'Hide this transaction.\n\n\n\n\nzerion:dismiss-action:' +
    actionId +
    ':' +
    expireAt
  );
}

export function getDismissExpireAt(nowMs: number): number {
  return Math.floor(nowMs / 1000) + DISMISS_PROOF_TTL_SECONDS;
}

function utf8ToHex(value: string): string {
  return ethers.hexlify(ethers.toUtf8Bytes(value));
}

function decodeSolanaSignature(signature: string): Uint8Array | null {
  const candidates: Array<() => Uint8Array> = [
    () =>
      ethers.getBytes(
        signature.startsWith('0x') ? signature : `0x${signature}`
      ),
    () => bs58.decode(signature),
    () => {
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) {
        throw new Error('not base64');
      }
      return base64ToUint8Array(signature);
    },
  ];
  for (const decode of candidates) {
    try {
      const bytes = decode();
      if (bytes.length === SOLANA_SIGNATURE_LENGTH) {
        return bytes;
      }
    } catch {
      // try the next encoding
    }
  }
  return null;
}

/** TBG verifies a base58 signature on Solana; signers hand back base58, base64 or 0x-hex. */
export function toBase58SolanaSignature(signature: string): string {
  const bytes = decodeSolanaSignature(signature);
  if (!bytes) {
    throw new Error('Unexpected Solana signature format');
  }
  return bs58.encode(bytes);
}

/** TBG verifies a 0x-hex signature on EVM */
export function toHexEvmSignature(signature: string): string {
  const hex = signature.startsWith('0x') ? signature : `0x${signature}`;
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Unexpected EVM signature format');
  }
  return hex;
}

export type DismissSigner =
  | {
      kind: 'software';
      ecosystem: 'evm' | 'solana';
      signMessage(params: {
        signerAddress: string;
        message: string;
        messageContextParams: MessageContextParams;
      }): Promise<string>;
      solanaSignMessageWithAddress(
        params: {
          signerAddress: string;
          messageHex: string;
        } & MessageContextParams
      ): Promise<{ signatureSerialized: string }>;
    }
  | {
      kind: 'ledger';
      ecosystem: 'evm' | 'solana';
      personalSign(message: string): Promise<string>;
      solana_signMessage(messageHex: string): Promise<string>;
    };

/** Signs the dismiss caption with `signer`; 0x-hex on EVM, base58 on Solana. */
export async function signDismissMessage({
  signer,
  address,
  message,
  messageContextParams,
}: {
  signer: DismissSigner;
  address: string;
  message: string;
  messageContextParams: MessageContextParams;
}): Promise<string> {
  if (signer.kind === 'software') {
    if (signer.ecosystem === 'evm') {
      return toHexEvmSignature(
        await signer.signMessage({
          signerAddress: address,
          message,
          messageContextParams,
        })
      );
    }
    const { signatureSerialized } = await signer.solanaSignMessageWithAddress({
      signerAddress: address,
      messageHex: utf8ToHex(message),
      ...messageContextParams,
    });
    return toBase58SolanaSignature(signatureSerialized);
  }
  if (signer.ecosystem === 'evm') {
    return toHexEvmSignature(await signer.personalSign(message));
  }
  return toBase58SolanaSignature(
    await signer.solana_signMessage(utf8ToHex(message))
  );
}

export type DismissPendingActionResult =
  | { kind: 'dismissed' }
  | { kind: 'cancelled' };

export interface DismissPendingActionDeps {
  lock: SignLock;
  nowMs(): number;
  /** Shows the confirm dialog; resolves with the proof signature once confirmed and signed, null on Cancel or close */
  confirmAndSign(
    request: { item: PendingAction; message: string },
    signal: AbortSignal
  ): Promise<string | null>;
  dismissAction(params: {
    actionId: string;
    proof: DismissActionProof;
  }): Promise<unknown>;
  onDismissed(item: PendingAction): void;
}

/** Confirms, signs and sends the dismiss proof of one unsigned row while holding the sign lock. */
export async function dismissPendingAction(
  item: PendingAction,
  deps: DismissPendingActionDeps
): Promise<DismissPendingActionResult> {
  const hold = deps.lock.acquire({
    pendingActionId: item.pendingActionId,
    kind: 'dismiss',
  });
  if (!hold) {
    throw new SignLockBusyError();
  }
  const { signal } = hold;
  try {
    const expireAt = getDismissExpireAt(deps.nowMs());
    const message = getDismissMessage(item.pendingActionId, expireAt);
    const signature = await untilAborted(
      deps.confirmAndSign({ item, message }, signal),
      signal
    );
    if (signature == null) {
      return { kind: 'cancelled' };
    }
    await untilAborted(
      deps.dismissAction({
        actionId: item.pendingActionId,
        proof: { address: item.address, expireAt, signature },
      }),
      signal
    );
    deps.onDismissed(item);
    return { kind: 'dismissed' };
  } catch (error) {
    if (error instanceof SignLockCancelledError) {
      return { kind: 'cancelled' };
    }
    throw error;
  } finally {
    hold.release();
  }
}
