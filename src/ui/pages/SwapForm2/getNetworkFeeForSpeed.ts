import BigNumber from 'bignumber.js';
import type {
  CustomConfiguration,
  NetworkFeeSpeed,
} from '@zeriontech/transactions';
import type { Quote2 } from 'src/shared/types/Quote';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { weiToGweiStr } from 'src/shared/units/formatGasPrice';
import { getEffectiveGasPrice } from './getEffectiveGasPrice';
import type { CustomFormDefaults } from './NetworkFeeDialog2/NetworkFeeCustomForm';

/**
 * The subset of `Quote2` the network-fee helpers and dialog actually read. Both
 * SwapForm2 (a real `Quote2`) and SendForm2 (a synthesized `sendQuote`) satisfy
 * this, so the fee dialog/helpers serve both forms with no special-casing.
 */
export type NetworkFeeQuote = Pick<Quote2, 'networkFee' | 'transactionSwap'>;

const toNum = (hex: string | null | undefined) =>
  hex == null || hex === '' ? null : Number(new BigNumber(hex));

/**
 * The current EIP-1559 base fee from `chain/get-gas-price`. The quote ships no
 * base fee, so this same current value is used both for the quote's "original"
 * effective price and for each preset.
 */
export function getBaseFee(gasPrices: ChainGasPrice | null): number | null {
  return (
    gasPrices?.fast.eip1559?.baseFee ??
    gasPrices?.fast.optimistic?.underlying.eip1559?.baseFee ??
    null
  );
}

/**
 * The swap tx's "original" effective gas price (in wei) — the price the quote's
 * `networkFee.amount` was priced at. By convention the backend prices a quote
 * at the `'fast'` speed.
 */
export function getSwapOriginalEffectiveGasPrice(
  quote: NetworkFeeQuote | null,
  baseFee: number | null
): number | null {
  const swapEvm = quote?.transactionSwap?.evm;
  if (!swapEvm) {
    return null;
  }
  return getEffectiveGasPrice(
    {
      gasPrice: toNum(swapEvm.gasPrice),
      maxFee: toNum(swapEvm.maxFee),
      maxPriorityFee: toNum(swapEvm.maxPriorityFee),
    },
    baseFee
  );
}

/** The effective gas price (in wei) for a preset speed from `gasPrices`. */
export function getPresetEffectiveGasPrice(
  speed: Exclude<NetworkFeeSpeed, 'custom'>,
  gasPrices: ChainGasPrice | null,
  baseFee: number | null
): number | null {
  if (!gasPrices) {
    return null;
  }
  const speedGasPrice = gasPrices[speed];
  const eip1559 =
    speedGasPrice?.eip1559 ?? speedGasPrice?.optimistic?.underlying.eip1559;
  const classic =
    speedGasPrice?.classic ?? speedGasPrice?.optimistic?.underlying.classic;
  return getEffectiveGasPrice(
    {
      gasPrice: eip1559 ? null : classic,
      maxFee: eip1559?.maxFee ?? null,
      maxPriorityFee: eip1559?.priorityFee ?? null,
    },
    baseFee
  );
}

/**
 * The effective gas price (in wei) for a given configuration's networkFee. For
 * a preset it reads `gasPrices[speed]`; for `'custom'` it reads the configured
 * custom values. Returns `null` if the price can't be resolved.
 */
export function getConfigurationEffectiveGasPrice(
  networkFee: CustomConfiguration['networkFee'],
  gasPrices: ChainGasPrice | null,
  baseFee: number | null
): number | null {
  const { speed, custom1559GasPrice, customClassicGasPrice } = networkFee;
  if (speed === 'custom') {
    return getEffectiveGasPrice(
      {
        gasPrice: customClassicGasPrice,
        maxFee: custom1559GasPrice?.maxFee ?? null,
        maxPriorityFee: custom1559GasPrice?.priorityFee ?? null,
      },
      baseFee
    );
  }
  return getPresetEffectiveGasPrice(speed, gasPrices, baseFee);
}

/**
 * The multiplier to apply to the quote's `networkFee.amount` to display the fee
 * at `effectiveGasPrice`, relative to the swap tx's original (fast) effective
 * price. Returns `1` when either price can't be resolved (no scaling).
 */
export function getNetworkFeeRatio(
  quote: NetworkFeeQuote | null,
  effectiveGasPrice: number | null,
  baseFee: number | null
): number {
  const original = getSwapOriginalEffectiveGasPrice(quote, baseFee);
  if (!original || original <= 0) {
    return 1;
  }
  if (!effectiveGasPrice || effectiveGasPrice <= 0) {
    return 1;
  }
  return effectiveGasPrice / original;
}

/** The swap tx's original gas limit (decimal), or `null` if unavailable. */
export function getSwapOriginalGasLimit(
  quote: NetworkFeeQuote | null
): number | null {
  return toNum(quote?.transactionSwap?.evm?.gas);
}

const hexToGwei = (hex: string | null | undefined) =>
  hex == null || hex === '' ? null : weiToGweiStr(new BigNumber(hex).toFixed());

/**
 * Quote-derived defaults (GWEI for gas prices, decimal for gas limit) for the
 * custom network-fee form, taken from the swap tx's own values. These seed the
 * form below any existing user override and above the hardcoded fallbacks.
 */
export function getCustomFormDefaults(
  quote: NetworkFeeQuote | null
): CustomFormDefaults {
  const swapEvm = quote?.transactionSwap?.evm;
  return {
    priorityFee: swapEvm?.maxPriorityFee
      ? hexToGwei(swapEvm.maxPriorityFee)
      : null,
    maxFee: swapEvm?.maxFee ? hexToGwei(swapEvm.maxFee) : null,
    baseFee: swapEvm?.gasPrice ? hexToGwei(swapEvm.gasPrice) : null,
    gasLimit: swapEvm?.gas ? new BigNumber(swapEvm.gas).toFixed() : null,
  };
}

/**
 * The full multiplier to apply to the quote's `networkFee.amount` for a custom
 * configuration: combines the effective-gas-price ratio with the gas-limit
 * ratio (the quote bundles `gasPrice × gasLimit` into the fee). `gasLimit` is in
 * decimal units; pass `null` to keep the swap tx's own gas limit (ratio 1).
 */
export function getCustomFeeRatio(
  quote: NetworkFeeQuote | null,
  effectiveGasPrice: number | null,
  gasLimit: number | null,
  baseFee: number | null
): number {
  const priceRatio = getNetworkFeeRatio(quote, effectiveGasPrice, baseFee);
  const originalGasLimit = getSwapOriginalGasLimit(quote);
  const limitRatio =
    gasLimit != null && originalGasLimit != null && originalGasLimit > 0
      ? gasLimit / originalGasLimit
      : 1;
  return priceRatio * limitRatio;
}
