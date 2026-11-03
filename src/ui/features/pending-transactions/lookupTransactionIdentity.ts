import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { isSameTxHash, type RowTransaction } from './mergePendingEntries';

export type TransactionIdentity = {
  chainId: string;
  hash: string;
  sender: string;
  nonce: number;
};

/** Reads who sent a local action's transaction and with which nonce from the transaction the wallet signed; null on Solana, which has no nonce (WLT-2951). */
export function lookupTransactionIdentity(
  action: Pick<LocalAddressAction, 'rawTransaction'>
): TransactionIdentity | null {
  const raw = action.rawTransaction;
  if (
    !raw?.hash ||
    !raw.from ||
    !Number.isInteger(raw.nonce) ||
    raw.nonce < 0
  ) {
    return null;
  }
  return {
    chainId: raw.chain,
    hash: raw.hash,
    sender: raw.from,
    nonce: raw.nonce,
  };
}

function withIdentity<T extends RowTransaction | null>(
  transaction: T,
  identity: TransactionIdentity
): T {
  if (
    transaction &&
    transaction.chain.id === identity.chainId &&
    isSameTxHash(transaction.hash, identity.hash)
  ) {
    return { ...transaction, sender: identity.sender, nonce: identity.nonce };
  }
  return transaction;
}

/** Writes the sender and nonce onto the transactions that carry the identity's hash on its chain; the status stays as it is. */
export function withTransactionIdentity<T extends LocalAddressAction>(
  action: T
): T {
  const identity = lookupTransactionIdentity(action);
  if (!identity) {
    return action;
  }
  return {
    ...action,
    transaction: withIdentity(action.transaction, identity),
    acts:
      action.acts?.map((act) => ({
        ...act,
        transaction: withIdentity(act.transaction, identity),
      })) ?? null,
  };
}
