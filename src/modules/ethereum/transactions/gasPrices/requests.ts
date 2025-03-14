import type { Chain } from 'src/modules/networks/Chain';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import type { Networks } from 'src/modules/networks/Networks';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import type { ChainGasPrice } from './types';

export async function fetchGasPriceFromNode(
  chain: Chain,
  networks: Networks
): Promise<ChainGasPrice> {
  const url = networks.getRpcUrlInternal(chain);
  if (!url) {
    throw new Error(`RPC URL is missing from network config for ${chain}`);
  }

  const { result } = await sendRpcRequest<string>(url, {
    method: 'eth_gasPrice',
    params: null,
  });
  const gasPrice = Number(result);
  return {
    average: {
      classic: gasPrice,
      eip1559: null,
      optimistic: null,
      eta: null,
    },
    fast: {
      classic: gasPrice,
      eip1559: null,
      optimistic: null,
      eta: null,
    },
  };
}

export async function fetchGasPrice({
  chain,
  networks,
  source,
  apiClient,
}: {
  chain: Chain;
  networks: Networks;
  source: 'testnet' | 'mainnet';
  apiClient: ZerionApiClient;
}) {
  try {
    const response = await apiClient.getGasPrices({ chain }, { source });
    const chainGasPrices = response.data;
    if (chainGasPrices) {
      return chainGasPrices;
    } else {
      throw new Error('unable to get gas prices from api');
    }
  } catch {
    return fetchGasPriceFromNode(chain, networks);
  }
}
