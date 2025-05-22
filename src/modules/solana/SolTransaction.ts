import type { Transaction, VersionedTransaction } from '@solana/web3.js';
import type { StringBase64 } from 'src/shared/types/StringBase64';

export { Transaction as SolanaTransactionLegacy } from '@solana/web3.js';
export type SolTransaction = Transaction | VersionedTransaction;

export type SolTxSerializable = StringBase64;
