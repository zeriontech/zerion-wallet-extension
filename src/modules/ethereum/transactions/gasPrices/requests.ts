import { ethers } from 'ethers';
import { client, mergeSingleEntity } from 'defi-sdk';
import type { EIP1559 } from '@zeriontech/transactions';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { Chain } from 'src/modules/networks/Chain';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import type { Networks } from 'src/modules/networks/Networks';
import { SLOW_MODE } from 'src/env/config';
import { wait } from 'src/shared/wait';

export interface OptimisticGasPriceInfo {
  l1?: number;
  l2?: number;
  fixed_overhead?: number;
  dynamic_overhead?: number;
}

export interface EIP1559GasPrices {
  base_fee: number;
  fast: EIP1559 | null;
  rapid: EIP1559 | null;
  slow: EIP1559 | null;
  standard: EIP1559 | null;
}

export interface ChainGasPrice {
  datetime: string;
  source: string;
  info: {
    classic?: {
      fast: number;
      rapid: number | null;
      slow: number;
      standard: number;
    };
    eip1559?: EIP1559GasPrices;
    optimistic?: OptimisticGasPriceInfo;
  };
}

export type Speed = keyof NonNullable<ChainGasPrice['info']['classic']>;

type Payload = Record<string, ChainGasPrice>;

const namespace = 'gas';
const scope = 'chain-prices';

export async function fetchGasPriceFromNode(
  chain: Chain,
  networks: Networks
): Promise<ChainGasPrice> {
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

class GasChainPricesSubscription {
  latestValue: Payload | null = null;
  initialPromise: Promise<Payload> | null = null;
  unsubscribe: (() => void) | null = null;

  async get() {
    if (SLOW_MODE) {
      await wait(4000);
    }
    if (this.latestValue) {
      return Promise.resolve(this.latestValue);
    } else if (this.initialPromise) {
      return this.initialPromise;
    } else {
      return Promise.race([
        this.initiateRequest(),
        rejectAfterDelay(10000, 'GasChainPricesSubscription'),
      ]).catch((error) => {
        this.initialPromise = null; // reset promise so that subsequent get() call will retry
        throw error;
      });
    }
  }

  initiateRequest() {
    this.initialPromise = new Promise((resolve) => {
      const { unsubscribe } = client.cachedSubscribe<
        Payload,
        typeof namespace,
        typeof scope
      >({
        namespace,
        body: {
          scope: [scope],
          payload: {},
        },
        onData: ({ value }) => {
          if (!value) {
            return;
          }
          if (!this.latestValue) {
            resolve(value);
          }
          this.latestValue = value;
        },
        mergeStrategy: mergeSingleEntity,
      });
      this.unsubscribe = unsubscribe;
    });
    return this.initialPromise;
  }
}

export const gasChainPricesSubscription = new GasChainPricesSubscription();

export async function fetchGasPrice(chain: Chain, networks: Networks) {
  try {
    if (networks.isSupportedByBackend(chain)) {
      const gasPrices = await gasChainPricesSubscription.get();
      const chainGasPrices = gasPrices[chain.toString()];
      if (chainGasPrices) {
        return chainGasPrices;
      } else {
        throw new Error('unable to get gas prices from api');
      }
    } else {
      throw new Error(`Gas Price info for ${chain} not supported`);
    }
  } catch {
    return fetchGasPriceFromNode(chain, networks);
  }
}
