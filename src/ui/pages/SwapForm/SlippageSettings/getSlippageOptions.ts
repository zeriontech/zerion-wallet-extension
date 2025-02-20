import type { Chain } from 'src/modules/networks/Chain';

type SlippageOptions = {
  default: number;
  options: number[];
};

interface SlippageConfig {
  [chainId: string]: SlippageOptions;
}

const DEFAULT_SLIPPAGE_OPTIONS: SlippageOptions = {
  default: 1.0,
  options: [0.5, 1.0],
};

const SLIPPAGE_BY_CHAIN: SlippageConfig = {
  ethereum: {
    default: 0.5,
    options: [0.2, 0.5],
  },
};

export function getSlippageOptions(chain: Chain) {
  return SLIPPAGE_BY_CHAIN[chain.toString()] ?? DEFAULT_SLIPPAGE_OPTIONS;
}
