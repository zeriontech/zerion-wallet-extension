import type {
  EthersV5TransactionReceiptStripped,
  EthersV5TransactionResponse,
} from 'src/background/Wallet/model/ethers-v5-types';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type { AnyAddressAction } from './addressAction';

/** Keys of `T` not shared with `Own`, all forced to `undefined` */
type Absent<T, Own> = { [K in Exclude<keyof T, keyof Own>]?: undefined };

type CombineUnion3<A, B, C> =
  | ({ [P in keyof A]: A[P] } & Absent<B, A> & Absent<C, A>)
  | ({ [P in keyof B]: B[P] } & Absent<A, B> & Absent<C, B>)
  | ({ [P in keyof C]: C[P] } & Absent<A, C> & Absent<B, C>);

type EvmObject = {
  hash: string;
  transaction: EthersV5TransactionResponse;
  relatedTransactionHash?: string;
  receipt?: EthersV5TransactionReceiptStripped;
};

/**
 * Transaction error
 */
type TransactionError = object | string;
/**
 * Transaction confirmation status
 * <pre>
 *   'processed': Transaction landed in a block which has reached 1 confirmation by the connected node
 *   'confirmed': Transaction landed in a block which has reached 1 confirmation by the cluster
 *   'finalized': Transaction landed in a block which has been finalized by the cluster
 * </pre>
 */
type TransactionConfirmationStatus = 'processed' | 'confirmed' | 'finalized';
/**
 * Signature status
 */
type SignatureStatus = {
  /** when the transaction was processed */
  slot: number;
  /** the number of blocks that have been confirmed and voted on in the fork containing `slot` */
  confirmations: number | null;
  /** transaction error, if any */
  err: TransactionError | null;
  /** cluster confirmation status, if data available. Possible responses: `processed`, `confirmed`, `finalized` */
  confirmationStatus?: TransactionConfirmationStatus;
};

type SolanaObject = {
  signature: string;
  publicKey: string;
  solanaBase64: StringBase64;
  signatureStatus: SignatureStatus | null;
};

export type OrderStatus = 'pending' | 'successful' | 'failed' | 'rejected';

export type OrderFill = { chain: string; hash: string };

/**
 * Intent-swap Order: a hash-less entry keyed by the backend `orderId`. Status
 * comes from `transaction/get-order-status/v1`, never from a receipt. `hash`
 * is `fills[0].hash` once settled and is display-only, never polled.
 */
type OrderObject = {
  orderId: string;
  orderStatus: OrderStatus;
  fills: OrderFill[];
  from: string;
  chain: string;
  explorerUrlTemplate: string | null;
  hash?: string;
};

export type TransactionObject = CombineUnion3<
  EvmObject,
  SolanaObject,
  OrderObject
> & {
  timestamp: number;
  initiator: string;
  dropped?: boolean;
  addressAction?: AnyAddressAction; // local saved simulation result to show full info while transaction is pending
};

export type StoredTransactions = Array<TransactionObject>;

/**
 * Store key of an entry: EVM hash, Solana signature or intent-swap orderId.
 * The orderId wins over a fill hash so a settled Order upserts onto its
 * pending entry instead of duplicating it.
 */
export function getTransactionObjectId(tx: TransactionObject): string {
  if (tx.orderId) {
    return tx.orderId;
  } else if (tx.signature) {
    return tx.signature;
  } else if (tx.hash) {
    return tx.hash;
  }
  throw new Error('TransactionObject has no identifier');
}
