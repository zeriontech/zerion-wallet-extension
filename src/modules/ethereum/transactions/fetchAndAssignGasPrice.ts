import { produce } from 'immer';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import omit from 'lodash/omit';
import { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
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

export async function estimateGasForNetwork<T extends IncomingTransaction>(
  transaction: T,
  network: NetworkConfig
) {
  const chainIdHex = resolveChainId(transaction);
  const rpcUrl = Networks.getNetworkRpcUrlInternal(network);
  let gasEstimation: string = '';
  try {
    const { result } = await sendRpcRequest<string>(rpcUrl, {
      method: 'eth_estimateGas',
      params: [
        omit({ ...hexifyTxValues({ transaction }), chainId: chainIdHex }, [
          'gas', // error on Aurora if gas: 0x0, so we omit it
          'nonce', // error on Polygon if nonce is int, but we don't need it at all
          'gasPrice', // error on Avalanche about maxFee being less than baseFee, event though only gasPrice in tx
        ]),
      ],
    });
    gasEstimation = result;
  } catch (error) {
    // Error on Abstract - if data: '', rpc returns an 'invalid param', so we need  transform '' into '0x'
    // However, data: '0x' can break Ledger transactions on Avalanche, so default request with '' and if it fails, try again with '0x'
    const { result } = await sendRpcRequest<string>(rpcUrl, {
      method: 'eth_estimateGas',
      params: [
        omit(
          {
            ...hexifyTxValues({ transaction, transformEmptyString: true }),
            chainId: chainIdHex,
          },
          [
            'gas', // error on Aurora if gas: 0x0, so we omit it
            'nonce', // error on Polygon if nonce is int, but we don't need it at all
            'gasPrice', // error on Avalanche about maxFee being less than baseFee, event though only gasPrice in tx
          ]
        ),
      ],
    });
    gasEstimation = result;
  }
  return add10Percent(parseInt(gasEstimation));
}

export async function estimateGas(
  transaction: IncomingTransaction,
  networks: Networks
) {
  const chainIdHex = resolveChainId(transaction);
  const network = networks.getNetworkById(chainIdHex);
  return estimateGasForNetwork(transaction, network);
}

async function fetchGasPriceForTransaction(
  transaction: IncomingTransaction,
  networks: Networks,
  { source, apiClient }: { source: NetworksSource; apiClient: ZerionApiClient }
): Promise<ChainGasPrice> {
  const chainId = resolveChainId(transaction);
  const network = wrappedGetNetworkById(networks, chainId);
  return fetchGasPrice({ network, source, apiClient });
}

export function hasGasEstimation(transaction: IncomingTransaction) {
  const gas = getGas(transaction);
  return gas && Number(gas) !== 0;
}

/**
 * This method checks if gas and network-fee related fields are present,
 * and if necessary, makes eth_estimateGas and eth_gasPrice calls and
 * applies the results to the transaction
 */
export async function prepareGasAndNetworkFee<T extends IncomingTransaction>(
  transaction: T,
  networks: Networks,
  { source, apiClient }: { source: NetworksSource; apiClient: ZerionApiClient }
) {
  const [gas, networkFeeInfo] = await Promise.all([
    hasGasEstimation(transaction) ? null : estimateGas(transaction, networks),
    hasNetworkFee(transaction)
      ? null
      : fetchGasPriceForTransaction(transaction, networks, {
          source,
          apiClient,
        }),
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
