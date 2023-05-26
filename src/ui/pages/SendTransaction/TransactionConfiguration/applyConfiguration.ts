import { ethers } from 'ethers';
import produce from 'immer';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
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
      if (networkFee.custom1559GasPrice) {
        delete draft.gasPrice;
        draft.maxFeePerGas = ethers.utils.hexValue(
          networkFee.custom1559GasPrice.max_fee
        );
        draft.maxPriorityFeePerGas = ethers.utils.hexValue(
          networkFee.custom1559GasPrice.priority_fee
        );
      } else if (networkFee.customClassicGasPrice) {
        draft.gasPrice = ethers.utils.hexValue(
          networkFee.customClassicGasPrice
        );
      }
    } else if (chainGasPrices) {
      if (chainGasPrices.info.eip1559) {
        delete draft.gasPrice;
        const maxFee = chainGasPrices.info.eip1559[networkFee.speed]?.max_fee;
        const priorityFee =
          chainGasPrices.info.eip1559[networkFee.speed]?.priority_fee;
        if (maxFee && priorityFee) {
          draft.maxFeePerGas = ethers.utils.hexValue(maxFee);
          draft.maxPriorityFeePerGas = ethers.utils.hexValue(priorityFee);
        }
      } else if (chainGasPrices.info.classic) {
        const baseFee = chainGasPrices.info.classic[networkFee.speed];
        draft.gasPrice = ethers.utils.hexValue(baseFee);
      }
    }
  });
}
