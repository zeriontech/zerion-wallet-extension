import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { Chain } from 'src/modules/networks/Chain';
import type { TransactionAction } from 'src/modules/ethereum/transactions/describeTransaction';
import type { NetworksSource } from 'src/modules/zerion-api/shared';

export function isInterpretQueryEnabled({
  supportsSimulations,
  isWaitingForGasPrices,
  isPrepared,
}: {
  supportsSimulations: boolean;
  isWaitingForGasPrices: boolean;
  isPrepared: boolean;
}): boolean {
  return supportsSimulations && !isWaitingForGasPrices && isPrepared;
}

export function getInterpretQueryKey(input: {
  populatedTransaction: IncomingTransactionWithChainId;
  chainGasPrices: ChainGasPrice | undefined;
  configuration: CustomConfiguration;
  allowanceQuantityBase: string;
  chain: Chain;
  singleAddress: string;
  transactionAction: TransactionAction;
  currency: string;
  source: NetworksSource;
  eligible: boolean | undefined;
  eligibilityStatus: string;
  origin: string;
  walletAddress: string;
}): unknown[] {
  return [
    'interpretTxBasedOnEligibility',
    input.populatedTransaction,
    input.chainGasPrices,
    input.configuration,
    input.allowanceQuantityBase,
    input.chain,
    input.singleAddress,
    input.transactionAction,
    input.currency,
    input.source,
    input.eligible,
    input.eligibilityStatus,
    input.origin,
    input.walletAddress,
  ];
}
