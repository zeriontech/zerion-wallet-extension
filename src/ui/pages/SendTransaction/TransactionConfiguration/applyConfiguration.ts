import { produce } from 'immer';
import type { CustomConfiguration } from '@zeriontech/transactions';
import { valueToHex } from 'src/shared/units/valueToHex';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';

export const DEFAULT_CONFIGURATION: CustomConfiguration = {
  slippage: 0.005,
  nonce: null,
  networkFee: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
    gasLimit: null,
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
      if (networkFee.gasLimit) {
        draft.gas = valueToHex(networkFee.gasLimit);
        draft.gasLimit = valueToHex(networkFee.gasLimit);
      }
      if (networkFee.custom1559GasPrice || networkFee.customClassicGasPrice) {
        assignGasPrice(draft, {
          eip1559: networkFee.custom1559GasPrice,
          classic: networkFee.customClassicGasPrice,
          optimistic: null,
        });
      } else if (chainGasPrices) {
        assignGasPrice(draft, chainGasPrices.fast);
      } else {
        throw new Error(
          'Either chain gas price or custom gas price config should be defined'
        );
      }
    } else if (chainGasPrices) {
      assignGasPrice(draft, chainGasPrices[networkFee.speed]);
    }
  });
}
