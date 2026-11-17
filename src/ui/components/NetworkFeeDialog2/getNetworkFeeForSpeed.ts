import BigNumber from 'bignumber.js';
import type {
  CustomConfiguration,
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from 'src/shared/types/TransactionConfiguration';
import type { Quote2 } from 'src/shared/types/Quote';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { gweiToWei, weiToGweiStr } from 'src/shared/units/formatGasPrice';
import { commonToBase } from 'src/shared/units/convert';
import { getEffectiveGasPrice } from './getEffectiveGasPrice';
import type { CustomFormDefaults } from './NetworkFeeCustomForm';

/**
 * The subset of `Quote2` the network-fee helpers and dialog actually read. Both
 * SwapForm2 (a real `Quote2`) and SendForm2 (a synthesized `sendQuote`) satisfy
 * this, so the fee dialog/helpers serve both forms with no special-casing.
 */
export type NetworkFeeQuote = Pick<Quote2, 'networkFee' | 'transactionSwap'> & {
  /** Optional: a swap quote's approval, used to detect multi-tx fee scopes. */
  transactionApprove?: Quote2['transactionApprove'];
};

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
  baseFee: number | null,
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
    baseFee,
  );
}

/** The effective gas price (in wei) for a preset speed from `gasPrices`. */
export function getPresetEffectiveGasPrice(
  speed: Exclude<NetworkFeeSpeed, 'custom'>,
  gasPrices: ChainGasPrice | null,
  baseFee: number | null,
): number | null {
  if (!gasPrices) {
    return null;
  }
  const speedGasPrice = gasPrices[speed];
  const eip1559 = speedGasPrice?.eip1559 ?? speedGasPrice?.optimistic?.underlying.eip1559;
  const classic = speedGasPrice?.classic ?? speedGasPrice?.optimistic?.underlying.classic;
  return getEffectiveGasPrice(
    {
      gasPrice: eip1559 ? null : classic,
      maxFee: eip1559?.maxFee ?? null,
      maxPriorityFee: eip1559?.priorityFee ?? null,
    },
    baseFee,
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
  baseFee: number | null,
): number | null {
  const { speed, custom1559GasPrice, customClassicGasPrice } = networkFee;
  if (speed === 'custom') {
    return getEffectiveGasPrice(
      {
        gasPrice: customClassicGasPrice,
        maxFee: custom1559GasPrice?.maxFee ?? null,
        maxPriorityFee: custom1559GasPrice?.priorityFee ?? null,
      },
      baseFee,
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
  baseFee: number | null,
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
export function getSwapOriginalGasLimit(quote: NetworkFeeQuote | null): number | null {
  return toNum(quote?.transactionSwap?.evm?.gas);
}

const hexToGwei = (hex: string | null | undefined) =>
  hex == null || hex === '' ? null : weiToGweiStr(new BigNumber(hex).toFixed());

/**
 * Quote-derived defaults (GWEI for gas prices, decimal for gas limit) for the
 * custom network-fee form, taken from the swap tx's own values. These seed the
 * form below any existing user override and above the hardcoded fallbacks.
 */
export function getCustomFormDefaults(quote: NetworkFeeQuote | null): CustomFormDefaults {
  const swapEvm = quote?.transactionSwap?.evm;
  return {
    priorityFee: swapEvm?.maxPriorityFee ? hexToGwei(swapEvm.maxPriorityFee) : null,
    maxFee: swapEvm?.maxFee ? hexToGwei(swapEvm.maxFee) : null,
    baseFee: swapEvm?.gasPrice ? hexToGwei(swapEvm.gasPrice) : null,
    gasLimit: swapEvm?.gas ? new BigNumber(swapEvm.gas).toFixed() : null,
  };
}

/**
 * The multiplier for the custom **Expected Fee**. The backend prices
 * `networkFee.amount` on expected gas (WLT-2743), so the gas limit is not part
 * of the expected cost — only the effective gas price changes.
 */
export function getCustomExpectedFeeRatio(
  quote: NetworkFeeQuote | null,
  effectiveGasPrice: number | null,
  baseFee: number | null,
): number {
  return getNetworkFeeRatio(quote, effectiveGasPrice, baseFee);
}

function getGasUsed(quote: NetworkFeeQuote | null): number | null {
  const gas = quote?.networkFee?.gasUsed;
  return typeof gas === 'number' && gas > 0 ? gas : null;
}

/**
 * Gas units the backend priced the fee on: `gasUsed` when present, otherwise
 * the fee amount converted back through the quote transaction's effective
 * price. `null` when neither input is usable.
 */
export function getExpectedGasForQuote(
  quote: NetworkFeeQuote | null,
  baseFee: number | null,
  decimals: number | null,
): number | null {
  const gasUsed = getGasUsed(quote);
  if (gasUsed != null) {
    return gasUsed;
  }
  const quantity = quote?.networkFee?.amount?.quantity;
  const price = getSwapOriginalEffectiveGasPrice(quote, baseFee);
  if (!quantity || decimals == null || !price || price <= 0) {
    return null;
  }
  const gas = commonToBase(quantity, decimals).dividedBy(price);
  return gas.isFinite() && gas.gt(0) ? gas.toNumber() : null;
}

/**
 * The multiplier for the custom **Max Fee**: `maxFeePerGas × gasLimit`,
 * relative to the quote's expected cost. The gas-limit denominator is the
 * expected gas for a single-tx quote. For an approval + swap quote `gasUsed`
 * is the sum across both transactions and cannot describe the swap-only limit,
 * so fall back to the swap tx's own gas limit (previous behaviour).
 */
export function getCustomMaxFeeRatio(
  quote: NetworkFeeQuote | null,
  maxFeePerGas: number | null,
  gasLimit: number | null,
  baseFee: number | null,
  decimals: number | null,
): number {
  const priceRatio = getNetworkFeeRatio(quote, maxFeePerGas, baseFee);
  const expectedGas = getExpectedGasForQuote(quote, baseFee, decimals);
  const hasApprove = Boolean(quote?.transactionApprove?.evm);
  const denominator =
    !hasApprove && expectedGas != null && expectedGas > 0
      ? expectedGas
      : getSwapOriginalGasLimit(quote);
  const limitRatio =
    gasLimit != null && denominator != null && denominator > 0 ? gasLimit / denominator : 1;
  return priceRatio * limitRatio;
}

export type ScalableNetworkFee = {
  free: boolean;
  amount: {
    quantity: string;
    value: number | null;
    usdValue: number | null;
    [key: string]: unknown;
  } | null;
};

/**
 * Scales a backend network fee to the selected speed. `null`/`1` leaves the
 * fee untouched, so callers degrade to the value the backend sent instead of a
 * guess.
 */
export function scaleNetworkFee<T extends ScalableNetworkFee>(
  networkFee: T,
  ratio: number | null,
): T {
  if (
    networkFee.free ||
    ratio == null ||
    !Number.isFinite(ratio) ||
    ratio <= 0 ||
    ratio === 1 ||
    !networkFee.amount
  ) {
    return networkFee;
  }
  const { amount } = networkFee;
  return {
    ...networkFee,
    amount: {
      ...amount,
      quantity: new BigNumber(amount.quantity).times(ratio).toFixed(),
      value: amount.value == null ? amount.value : amount.value * ratio,
      usdValue: amount.usdValue == null ? amount.usdValue : amount.usdValue * ratio,
    },
  };
}

/**
 * The display multiplier for a complete network-fee configuration's expected
 * fee. Presets use `gasPrices[speed]`; Custom uses its gas prices. The custom
 * gas limit is priced separately as the Max Fee.
 */
export function getNetworkFeeRatioForConfiguration(
  quote: NetworkFeeQuote | null,
  networkFee: NetworkFeeConfiguration,
  gasPrices: ChainGasPrice | null,
  baseFee: number | null,
): number {
  if (networkFee.speed === 'custom') {
    const effective = getConfigurationEffectiveGasPrice(networkFee, gasPrices, baseFee);
    return getCustomExpectedFeeRatio(quote, effective, baseFee);
  }
  const effective = getPresetEffectiveGasPrice(networkFee.speed, gasPrices, baseFee);
  return getNetworkFeeRatio(quote, effective, baseFee);
}

const gweiStringToWei = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? gweiToWei(num) : null;
};

/**
 * The Custom-row amount before the user has configured Custom. Mirrors the
 * custom form's quote-derived initial values so the picker row is not blank.
 * Returns `null` when the defaults cannot produce a trustworthy amount.
 */
export function getCustomFeeRatioFromDefaults(
  quote: NetworkFeeQuote | null,
  defaults: CustomFormDefaults | undefined,
  isEip1559: boolean,
  baseFee: number | null,
): number | null {
  if (!quote || !defaults) {
    return null;
  }
  if (isEip1559) {
    const effective = getEffectiveGasPrice(
      {
        maxFee: gweiStringToWei(defaults.maxFee),
        maxPriorityFee: gweiStringToWei(defaults.priorityFee),
      },
      baseFee,
    );
    if (effective == null) {
      return null;
    }
    return getCustomExpectedFeeRatio(quote, effective, baseFee);
  }
  const gasPrice = gweiStringToWei(defaults.baseFee);
  if (gasPrice == null) {
    return null;
  }
  return getCustomExpectedFeeRatio(quote, gasPrice, baseFee);
}
