import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';

/**
 * Tells the backend to start indexing a transaction we have just broadcast.
 * Fire-and-forget: nothing reads the response, and a failure here only means
 * the action shows up a little later.
 */
export async function registerTransaction(
  transaction: SerializableTransactionResponse,
  chain: string,
  mode: 'default' | 'testnet'
) {
  if (isCustomNetworkId(chain)) {
    return;
  }
  const source = mode === 'testnet' ? 'testnet' : 'mainnet';
  return ZerionAPI.transactionCollect(
    { hash: transaction.hash, chain },
    { source }
  ).catch(() => null);
}
