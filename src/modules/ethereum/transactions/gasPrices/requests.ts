import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import type { Networks } from 'src/modules/networks/Networks';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
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
  const gasPrice = ethers.BigNumber.from(result).toNumber();
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
}: {
  chain: Chain;
  networks: Networks;
  source: 'testnet' | 'mainnet';
}) {
  try {
    const response = await ZerionAPI.getGasPrices({ chain, source });
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
