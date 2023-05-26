import produce from 'immer';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';
import type { CustomConfiguration } from './TransactionConfiguration';

export function applyConfiguration(
  transaction: IncomingTransaction,
  configuration: CustomConfiguration,
  chainGasPrices?: ChainGasPrice | null
) {
  const { nonce, networkFee } = configuration;
  return produce(transaction, (draft) => {
    if (nonce != null) {
      draft.nonce = parseInt(nonce);
    }
    if (networkFee.speed === 'custom') {
      assignGasPrice(draft, {
        classic: networkFee.customClassicGasPrice,
        eip1559: networkFee.custom1559GasPrice,
      });
    } else if (chainGasPrices) {
      assignGasPrice(draft, {
        classic: chainGasPrices.info.classic?.[networkFee.speed],
        eip1559: chainGasPrices.info.eip1559?.[networkFee.speed],
      });
    }
  });
}
