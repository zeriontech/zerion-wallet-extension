import { produce } from 'immer';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';
import type { CustomConfiguration } from './TransactionConfiguration';

export const DEFAULT_CONFIGURATION: CustomConfiguration = {
  slippage: 0.01,
  nonce: null,
  networkFee: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
  },
};

export function applyConfiguration<T extends IncomingTransaction>(
  transaction: T,
  configuration: CustomConfiguration,
  chainGasPrices?: ChainGasPrice | null
) {
  const { nonce, networkFee } = configuration;
  return produce(transaction, (draft) => {
    if (nonce != null) {
      draft.nonce = parseInt(nonce);
    }
    if (networkFee.speed === 'custom') {
      if (networkFee.custom1559GasPrice || networkFee.customClassicGasPrice) {
        assignGasPrice(draft, {
          eip1559: networkFee.custom1559GasPrice,
          classic: networkFee.customClassicGasPrice,
        });
      } else if (chainGasPrices) {
        assignGasPrice(draft, {
          classic: chainGasPrices.info.classic?.fast,
          eip1559: chainGasPrices.info.eip1559?.fast,
        });
      } else {
        throw new Error(
          'Either chain gas price or custom gas price config should be defined'
        );
      }
    } else if (chainGasPrices) {
      assignGasPrice(draft, {
        classic: chainGasPrices.info.classic?.[networkFee.speed],
        eip1559: chainGasPrices.info.eip1559?.[networkFee.speed],
      });
    }
  });
}
