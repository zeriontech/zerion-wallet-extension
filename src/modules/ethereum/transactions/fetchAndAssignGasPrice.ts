import { ethers } from 'ethers';
import produce from 'immer';
import omit from 'lodash/omit';
import { createChain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { invariant } from 'src/shared/invariant';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { assignChainGasPrice } from './gasPrices/assignGasPrice';
import { hasNetworkFee } from './gasPrices/hasNetworkFee';
import type { ChainGasPrice } from './gasPrices/requests';
import { gasChainPricesSubscription } from './gasPrices/requests';
import { getGas } from './getGas';
import { wrappedGetNetworkById } from './wrappedGetNetworkById';

function resolveChainId(transaction: IncomingTransaction) {
  const { chainId: incomingChainId } = transaction;
  invariant(incomingChainId, 'Transaction object must have a chainId property');
  return ethers.utils.hexValue(incomingChainId);
}

function add10Percent(value: number) {
  return Math.round(value * 1.1); // result must be an integer
}

async function estimateGas(
  transaction: IncomingTransaction,
  networks: Networks
) {
  const chainId = resolveChainId(transaction);
  const rpcUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
  const { result } = await sendRpcRequest<string>(rpcUrl, {
    method: 'eth_estimateGas',
    params: [
      omit(transaction, [
        'gas', // error on Aurora if gas: 0x0, so we omit it
        'nonce', // error on Polygon if nonce is int, but we don't need it at all
      ]),
    ],
  });
  return add10Percent(parseInt(result));
}

async function fetchGasPrice(
  transaction: IncomingTransaction,
  networks: Networks
): Promise<ChainGasPrice> {
  const chainId = resolveChainId(transaction);
  const network = wrappedGetNetworkById(networks, chainId);
  const chain = createChain(network.chain);
  if (networks.isSupportedByBackend(chain)) {
    /** Use gas price info from our API */
    const gasChainPrices = await gasChainPricesSubscription.get();
    const gasPricesInfo = gasChainPrices[chain.toString()];
    if (!gasPricesInfo) {
      throw new Error(`Gas Price info for ${chain} not found`);
    }
    return gasPricesInfo;
  } else {
    /** Query the node directly */
    const url = networks.getRpcUrlInternal(chain);
    if (!url) {
      throw new Error(`RPC URL is missing from network config for ${chain}`);
    }
    const requestDate = new Date();
    const { result } = await sendRpcRequest<string>(url, {
      method: 'eth_gasPrice',
      params: null,
    });
    const gasPrice = ethers.BigNumber.from(result).toNumber();
    return {
      info: {
        classic: {
          fast: gasPrice,
          standard: gasPrice,
          slow: gasPrice,
          rapid: null,
        },
      },
      datetime: requestDate.toString(),
      source: url,
    };
  }
}

function hasGasEstimation(transaction: IncomingTransaction) {
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
  networks: Networks
) {
  const [gas, networkFeeInfo] = await Promise.all([
    hasGasEstimation(transaction) ? null : estimateGas(transaction, networks),
    hasNetworkFee(transaction) ? null : fetchGasPrice(transaction, networks),
  ]);
  return produce(transaction, (draft) => {
    if (gas) {
      delete draft.gas;
      draft.gasLimit = gas;
    }
    if (networkFeeInfo) {
      assignChainGasPrice(transaction, networkFeeInfo);
    }
  });
}
