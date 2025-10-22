import type {
  EthersV5TransactionReceiptStripped,
  EthersV5TransactionResponse,
} from 'src/background/Wallet/model/ethers-v5-types';
import type { StringBase64 } from 'src/shared/types/StringBase64';

type CombineUnion<A, B> =
  | ({ [P in keyof A]: A[P] } & { [K in keyof B]?: undefined })
  | ({
      [K in keyof B]: B[K];
    } & { [P in keyof A]?: undefined });

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

export type TransactionObject = CombineUnion<EvmObject, SolanaObject> & {
  timestamp: number;
  initiator: string;
  dropped?: boolean;
};

export type StoredTransactions = Array<TransactionObject>;
