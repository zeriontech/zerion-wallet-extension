import BigNumber from 'bignumber.js';
import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Quote2, TransactionEVM } from 'src/shared/types/Quote';
import { getEffectiveGasPrice } from 'src/ui/components/NetworkFeeDialog2/getEffectiveGasPrice';

function hexToBn(value: string | null | undefined): BigNumber | null {
  if (value == null || value === '') {
    return null;
  }
  const bn = new BigNumber(value);
  return bn.isFinite() ? bn : null;
}

function bnToHex(value: BigNumber): string {
  // Gas-price math can produce fractional wei (ratio scaling); wei must be an
  // integer when serialized to hex.
  return `0x${value.integerValue(BigNumber.ROUND_FLOOR).toString(16)}`;
}

/** wei BigNumber → plain number for ratio math (gwei-scale magnitudes are safe). */
function bnToNum(value: BigNumber | null): number | null {
  return value == null ? null : value.toNumber();
}

interface NewSwapGasPrice {
  /** EIP-1559 fields, in wei (BigNumber), when the new config is 1559. */
  maxFee: BigNumber | null;
  maxPriorityFee: BigNumber | null;
  /** Legacy field, in wei (BigNumber), when the new config is classic. */
  gasPrice: BigNumber | null;
}

/**
 * Resolve the swap transaction's new gas-price fields from the configuration.
 * Preset (fast/average) reads the current `chain/get-gas-price`; custom reads
 * the user's values. Never converts the tx between 1559 and legacy — it mirrors
 * whichever shape the configuration produces.
 */
function resolveSwapGasPrice(
  config: CustomConfiguration,
  gasPrices: ChainGasPrice,
): NewSwapGasPrice | null {
  const { speed, custom1559GasPrice, customClassicGasPrice } = config.networkFee;

  if (speed === 'custom') {
    if (custom1559GasPrice) {
      return {
        maxFee: new BigNumber(custom1559GasPrice.maxFee),
        maxPriorityFee: new BigNumber(custom1559GasPrice.priorityFee),
        gasPrice: null,
      };
    }
    if (customClassicGasPrice != null) {
      return {
        maxFee: null,
        maxPriorityFee: null,
        gasPrice: new BigNumber(customClassicGasPrice),
      };
    }
    return null;
  }

  const speedGasPrice = gasPrices[speed];
  if (!speedGasPrice) {
    return null;
  }
  const eip1559 = speedGasPrice.eip1559 ?? speedGasPrice.optimistic?.underlying.eip1559;
  if (eip1559) {
    return {
      maxFee: new BigNumber(eip1559.maxFee),
      maxPriorityFee: new BigNumber(eip1559.priorityFee),
      gasPrice: null,
    };
  }
  const classic = speedGasPrice.classic ?? speedGasPrice.optimistic?.underlying.classic;
  if (classic != null) {
    return {
      maxFee: null,
      maxPriorityFee: null,
      gasPrice: new BigNumber(classic),
    };
  }
  return null;
}

/** Write resolved gas-price fields onto an EVM tx without changing its shape. */
function applyGasPriceToSwapTx(
  evm: TransactionEVM,
  next: NewSwapGasPrice,
  gasLimit: string | null,
): TransactionEVM {
  const updated: TransactionEVM = { ...evm };
  if (next.gasPrice != null) {
    updated.gasPrice = bnToHex(next.gasPrice);
    updated.maxFee = null;
    updated.maxPriorityFee = null;
  } else if (next.maxFee != null || next.maxPriorityFee != null) {
    updated.maxFee = next.maxFee != null ? bnToHex(next.maxFee) : null;
    updated.maxPriorityFee = next.maxPriorityFee != null ? bnToHex(next.maxPriorityFee) : null;
    updated.gasPrice = null;
  }
  if (gasLimit != null && gasLimit !== '') {
    updated.gas = bnToHex(new BigNumber(gasLimit));
  }
  return updated;
}

/**
 * Scale the approve transaction's gas fields by the swap tx's **single**
 * effective-price ratio. Independent per-field ratios could push the approve's
 * tip above its max fee; one ratio preserves the approve's own valid
 * tip/max-fee relationship. The gas limit follows its own ratio.
 */
function scaleApproveTx(
  evm: TransactionEVM,
  priceRatio: number,
  gasLimitRatio: number,
): TransactionEVM {
  const updated: TransactionEVM = { ...evm };

  const scaleField = (value: string | null, ratio: number) => {
    const bn = hexToBn(value);
    if (bn == null || ratio === 1 || !Number.isFinite(ratio) || ratio <= 0) {
      return value;
    }
    return bnToHex(bn.multipliedBy(ratio));
  };

  updated.maxFee = scaleField(evm.maxFee, priceRatio);
  updated.maxPriorityFee = scaleField(evm.maxPriorityFee, priceRatio);
  updated.gasPrice = scaleField(evm.gasPrice, priceRatio);

  // EIP-1559 requires tip <= max fee. Scaling preserves a valid original
  // relationship, but guard anyway so an invalid backend approve cannot become
  // an invalid signed transaction.
  const maxFee = hexToBn(updated.maxFee);
  const tip = hexToBn(updated.maxPriorityFee);
  if (maxFee != null && tip != null && tip.gt(maxFee)) {
    updated.maxPriorityFee = bnToHex(maxFee);
  }

  const gas = hexToBn(evm.gas);
  if (gas != null && gasLimitRatio !== 1) {
    updated.gas = bnToHex(gas.multipliedBy(gasLimitRatio));
  }

  return updated;
}

/**
 * Apply a network-fee configuration to a quote's transactions, returning a new
 * quote with only `transactionSwap` and `transactionApprove` changed (the
 * displayed `networkFee` is scaled separately — it is left untouched here).
 *
 * The swap tx gets the configured price directly. The approve tx (if present)
 * follows the swap's per-field relative change (maxFee, priorityFee, gasPrice)
 * plus the gas-limit change.
 *
 * Pass-through (returns the quote unchanged) when: gasPrices is null, the swap
 * tx isn't EVM, or the configuration can't be resolved to a price.
 */
export function applyTransactionConfiguration(
  quote: Quote2,
  config: CustomConfiguration,
  gasPrices: ChainGasPrice | null,
): Quote2 {
  const transactionSwap = quote.transactionSwap;
  const swapEvm = transactionSwap?.evm;
  if (!gasPrices || !transactionSwap || !swapEvm) {
    return quote;
  }

  const next = resolveSwapGasPrice(config, gasPrices);
  if (!next) {
    return quote;
  }

  // One ratio for both approve gas-price fields: the swap tx's effective price
  // change. Using per-field ratios could make the approve's tip exceed its max
  // fee when the swap's tip and maxFee move by different relative amounts.
  const baseFee =
    gasPrices.fast.eip1559?.baseFee ??
    gasPrices.fast.optimistic?.underlying.eip1559?.baseFee ??
    null;
  const oldEffectivePrice = getEffectiveGasPrice(
    {
      gasPrice: bnToNum(hexToBn(swapEvm.gasPrice)),
      maxFee: bnToNum(hexToBn(swapEvm.maxFee)),
      maxPriorityFee: bnToNum(hexToBn(swapEvm.maxPriorityFee)),
    },
    baseFee,
  );
  const newEffectivePrice = getEffectiveGasPrice(
    {
      gasPrice: next.gasPrice?.toNumber() ?? null,
      maxFee: next.maxFee?.toNumber() ?? null,
      maxPriorityFee: next.maxPriorityFee?.toNumber() ?? null,
    },
    baseFee,
  );
  const priceRatio =
    oldEffectivePrice != null &&
    oldEffectivePrice > 0 &&
    newEffectivePrice != null &&
    newEffectivePrice > 0
      ? newEffectivePrice / oldEffectivePrice
      : 1;

  const originalGas = bnToNum(hexToBn(swapEvm.gas));
  const customGasLimit =
    config.networkFee.gasLimit && config.networkFee.gasLimit !== ''
      ? Number(config.networkFee.gasLimit)
      : null;
  const gasLimitRatio =
    customGasLimit != null && originalGas && originalGas > 0 ? customGasLimit / originalGas : 1;

  const newSwapEvm = applyGasPriceToSwapTx(swapEvm, next, config.networkFee.gasLimit);

  const result: Quote2 = {
    ...quote,
    transactionSwap: { ...transactionSwap, evm: newSwapEvm },
  };

  const transactionApprove = quote.transactionApprove;
  if (transactionApprove?.evm) {
    result.transactionApprove = {
      ...transactionApprove,
      evm: scaleApproveTx(transactionApprove.evm, priceRatio, gasLimitRatio),
    };
  }

  return result;
}
