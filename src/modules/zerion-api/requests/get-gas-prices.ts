import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Chain } from 'src/modules/networks/Chain';

export interface Payload {
  chain: Chain;
}

export interface Response {
  data: ChainGasPrice;
  errors?: { title: string; detail: string }[];
}
