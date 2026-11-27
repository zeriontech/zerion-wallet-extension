import type { Quote2 } from 'src/shared/types/Quote';
import { isIntentQuote, toMultichainTransaction } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { applyTransactionConfiguration } from '../applyTransactionConfiguration';

/** The approve (if any), then the swap, with the local network-fee override applied. */
export function buildSimulationTransactions(
  quote: Quote2 | null,
  configuration: CustomConfiguration,
  gasPrices: ChainGasPrice | null,
): MultichainTransaction[] {
  if (!quote) return [];
  const configuredQuote = applyTransactionConfiguration(quote, configuration, gasPrices);
  const list: MultichainTransaction[] = [];
  if (configuredQuote.transactionApprove) {
    list.push(toMultichainTransaction(configuredQuote.transactionApprove));
  }
  if (configuredQuote.transactionSwap && !isIntentQuote(configuredQuote)) {
    list.push(toMultichainTransaction(configuredQuote.transactionSwap));
  }
  return list;
}
