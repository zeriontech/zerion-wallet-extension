import type { SolTxSerializable } from 'src/modules/solana/SolTransaction';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import type { OneOf } from '../type-utils/OneOf';

export type MultichainTransaction<
  E extends IncomingTransactionWithChainId = IncomingTransactionWithChainId,
  S extends SolTxSerializable = SolTxSerializable
> = OneOf<{
  evm: E;
  solana: S;
}>;
