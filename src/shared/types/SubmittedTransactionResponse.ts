import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';
import type { SolTransactionResponse } from 'src/modules/solana/transactions/SolTransactionResponse';
import type { OneOf } from '../type-utils/OneOf';

export type SubmittedTransactionResponse = OneOf<{
  ethereum: SerializableTransactionResponse;
  solana: SolTransactionResponse;
}>;

export type SubmittedAllTransactionsResponse = {
  ethereum: undefined;
  solana: SolTransactionResponse[];
};
