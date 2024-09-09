import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Chain } from 'src/modules/networks/Chain';
import type { BackendSourceParams } from '../shared';
import { ZerionHttpClient } from '../shared';

interface Payload {
  chain: Chain;
}

interface Response {
  data: ChainGasPrice;
  errors?: { title: string; detail: string }[];
}

export function getGasPrices(
  { chain }: Payload,
  { source }: BackendSourceParams
) {
  const params = new URLSearchParams({ chain: chain.toString() });
  const endpoint = `chain/get-gas-prices/v1${params}`;
  return ZerionHttpClient.get<Response>({ endpoint, source });
}
