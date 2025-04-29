import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';
import type { SolSignTransactionResult } from 'src/modules/solana/transactions/SolTransactionResponse';
import type { OneOf } from '../type-utils/OneOf';

export type SignTransactionResult = OneOf<{
  ethereum: SerializableTransactionResponse;
  solana: SolSignTransactionResult;
}>;

export type SignAllTransactionsResult = {
  ethereum: undefined;
  solana: SolSignTransactionResult[];
};
