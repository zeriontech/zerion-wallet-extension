import { ethers } from 'ethers';
import { produce } from 'immer';
import omit from 'lodash/omit';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworksSource } from 'src/modules/zerion-api/zerion-api';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { assignGasPrice } from './gasPrices/assignGasPrice';
import { hasNetworkFee } from './gasPrices/hasNetworkFee';
import { getGas } from './getGas';
import type { ChainGasPrice } from './gasPrices/types';
import { fetchGasPrice } from './gasPrices/requests';
import { wrappedGetNetworkById } from './wrappedGetNetworkById';
import { resolveChainId } from './resolveChainId';
import { hexifyTxValues } from './gasPrices/hexifyTxValues';

function add10Percent(value: number) {
  return Math.round(value * 1.1); // result must be an integer
}

export async function estimateGas(
  transaction: IncomingTransaction,
  networks: Networks
) {
  const chainIdHex = resolveChainId(transaction);
  const rpcUrl = networks.getRpcUrlInternal(networks.getChainById(chainIdHex));
  const { result } = await sendRpcRequest<string>(rpcUrl, {
    method: 'eth_estimateGas',
    params: [
      omit({ ...hexifyTxValues(transaction), chainId: chainIdHex }, [
        'gas', // error on Aurora if gas: 0x0, so we omit it
        'nonce', // error on Polygon if nonce is int, but we don't need it at all
        'gasPrice', // error on Avalanche about maxFee being less than baseFee, event though only gasPrice in tx
      ]),
    ],
  });
  return add10Percent(parseInt(result));
}

async function fetchGasPriceForTransaction(
  transaction: IncomingTransaction,
  networks: Networks,
  { source }: { source: NetworksSource }
): Promise<ChainGasPrice> {
  const chainId = resolveChainId(transaction);
  const network = wrappedGetNetworkById(networks, chainId);
  const chain = createChain(network.id);
  return fetchGasPrice({ chain, networks, source });
}

export function hasGasEstimation(transaction: IncomingTransaction) {
  const gas = getGas(transaction);
  return gas && !ethers.BigNumber.from(gas).isZero();
}

/**
 * This method checks if gas and network-fee related fields are present,
 * and if necessary, makes eth_estimateGas and eth_gasPrice calls and
 * applies the results to the transaction
 */
export async function prepareGasAndNetworkFee<T extends IncomingTransaction>(
  transaction: T,
  networks: Networks,
  { source }: { source: NetworksSource }
) {
  const [gas, networkFeeInfo] = await Promise.all([
    hasGasEstimation(transaction) ? null : estimateGas(transaction, networks),
    hasNetworkFee(transaction)
      ? null
      : fetchGasPriceForTransaction(transaction, networks, { source }),
  ]);
  return produce(transaction, (draft) => {
    if (gas) {
      delete draft.gas;
      draft.gasLimit = gas;
    }
    if (networkFeeInfo) {
      assignGasPrice(draft, networkFeeInfo.fast);
    }
  });
}
