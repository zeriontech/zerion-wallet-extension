import type { Transaction, VersionedTransaction } from '@solana/web3.js';

export { Transaction as SolanaTransactionLegacy } from '@solana/web3.js';
export type SolTransaction = Transaction | VersionedTransaction;
