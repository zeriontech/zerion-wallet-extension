import { ethers } from 'ethers';
import { createChain } from 'src/modules/networks/Chain';
import { UnsupportedNetwork } from 'src/modules/networks/errors';
import { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { assignGasPrice } from './gasPrices/assignGasPrice';
import {
  ChainGasPrice,
  gasChainPricesSubscription,
} from './gasPrices/requests';

function wrappedGetNetworkById(networks: Networks, chainId: string) {
  try {
    return networks.getNetworkById(chainId);
  } catch (error) {
    if (error instanceof UnsupportedNetwork) {
      throw new Error(
        `No network configuration found for ${chainId}.\nYou can add a custom network in the "Settings -> Networks" section.`
      );
    } else {
      throw error;
    }
  }
}

async function fetchGasPrice(
  transaction: IncomingTransaction,
  networks: Networks
): Promise<ChainGasPrice> {
  const { chainId: incomingChainId } = transaction;
  if (!incomingChainId) {
    throw new Error('Transaction object must have a chainId property');
  }
  const chainId = ethers.utils.hexValue(incomingChainId);
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

export async function fetchAndAssignGasPrice(
  transaction: IncomingTransaction,
  networks: Networks
) {
  const gasPricesInfo = await fetchGasPrice(transaction, networks);
  const { eip1559, classic } = gasPricesInfo.info;

  assignGasPrice(transaction, {
    eip1559: eip1559?.fast,
    classic: classic?.fast,
  });
}
