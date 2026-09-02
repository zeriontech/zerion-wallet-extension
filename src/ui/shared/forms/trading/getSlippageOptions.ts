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

function toPercents(value: number) {
  return value * 100;
}

function fromPercents(value: number) {
  return value / 100;
}

export function getSlippageOptions({
  chain,
  userSlippage,
}: {
  chain: Chain;
  userSlippage: number | null;
}) {
  const options =
    SLIPPAGE_BY_CHAIN[chain.toString()] ?? DEFAULT_SLIPPAGE_OPTIONS;

  const slippagePercent =
    userSlippage != null ? toPercents(userSlippage) : options.default;
  const slippage = fromPercents(slippagePercent);

  return { ...options, slippage, slippagePercent };
}
