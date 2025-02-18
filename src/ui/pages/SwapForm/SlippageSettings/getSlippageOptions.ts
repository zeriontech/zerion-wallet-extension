import type { Chain } from 'src/modules/networks/Chain';

// [defaultOptionIndex, [option1, option2]]
type SlippageOptions = [number, [number, number]];

interface SlippageConfig {
  [chainId: string]: SlippageOptions;
}

const DEFAULT_SLIPPAGE_OPTIONS: SlippageOptions = [1, [0.5, 1.0]];
const SLIPPAGE_BY_CHAIN: SlippageConfig = {
  ethereum: [1, [0.2, 0.5]],
};

export function getSlippageOptions(chain: Chain) {
  const [defaultOptionIndex, slippageOptions] =
    SLIPPAGE_BY_CHAIN[chain.toString()] ?? DEFAULT_SLIPPAGE_OPTIONS;
  const defaultSlippagePercent = slippageOptions[defaultOptionIndex];
  return { defaultSlippagePercent, slippageOptions };
}
