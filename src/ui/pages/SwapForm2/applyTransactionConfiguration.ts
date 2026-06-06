import BigNumber from 'bignumber.js';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Quote2, TransactionEVM } from 'src/shared/types/Quote';

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
  gasPrices: ChainGasPrice
): NewSwapGasPrice | null {
  const { speed, custom1559GasPrice, customClassicGasPrice } =
    config.networkFee;

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
  const eip1559 =
    speedGasPrice.eip1559 ?? speedGasPrice.optimistic?.underlying.eip1559;
  if (eip1559) {
    return {
      maxFee: new BigNumber(eip1559.maxFee),
      maxPriorityFee: new BigNumber(eip1559.priorityFee),
      gasPrice: null,
    };
  }
  const classic =
    speedGasPrice.classic ?? speedGasPrice.optimistic?.underlying.classic;
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
  gasLimit: string | null
): TransactionEVM {
  const updated: TransactionEVM = { ...evm };
  if (next.gasPrice != null) {
    updated.gasPrice = bnToHex(next.gasPrice);
    updated.maxFee = null;
    updated.maxPriorityFee = null;
  } else if (next.maxFee != null || next.maxPriorityFee != null) {
    updated.maxFee = next.maxFee != null ? bnToHex(next.maxFee) : null;
    updated.maxPriorityFee =
      next.maxPriorityFee != null ? bnToHex(next.maxPriorityFee) : null;
    updated.gasPrice = null;
  }
  if (gasLimit != null && gasLimit !== '') {
    updated.gas = bnToHex(new BigNumber(gasLimit));
  }
  return updated;
}

/** Per-field ratio of the swap tx's change: new / old. `null` when the swap had
 * no value for that field (so there's no ratio to apply to the approve). */
interface SwapFieldRatios {
  maxFee: number | null;
  maxPriorityFee: number | null;
  gasPrice: number | null;
}

/** A field's old→new ratio, or `null` when it can't be derived (no old value). */
function fieldRatio(
  oldValue: BigNumber | null,
  newValue: BigNumber | null
): number | null {
  if (oldValue == null || newValue == null || oldValue.isZero()) {
    return null;
  }
  return newValue.dividedBy(oldValue).toNumber();
}

/**
 * Scale the approve transaction's gas fields by the swap tx's *per-field*
 * relative change. Each approve field follows its same-named swap field:
 * approve.maxFee ← swap maxFee ratio, approve.maxPriorityFee ← swap priority
 * ratio, approve.gasPrice ← swap gasPrice ratio. A field with no swap-side
 * ratio (the swap tx didn't carry it) is left unchanged. The approve keeps its
 * own backend-sized magnitudes — only the relative change is mirrored.
 */
function scaleApproveTx(
  evm: TransactionEVM,
  ratios: SwapFieldRatios,
  gasLimitRatio: number
): TransactionEVM {
  const updated: TransactionEVM = { ...evm };

  const scaleField = (value: string | null, ratio: number | null) => {
    const bn = hexToBn(value);
    if (bn == null || ratio == null) {
      return value;
    }
    return bnToHex(bn.multipliedBy(ratio));
  };

  updated.maxFee = scaleField(evm.maxFee, ratios.maxFee);
  updated.maxPriorityFee = scaleField(
    evm.maxPriorityFee,
    ratios.maxPriorityFee
  );
  updated.gasPrice = scaleField(evm.gasPrice, ratios.gasPrice);

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
  gasPrices: ChainGasPrice | null
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

  // Per-field ratios of the swap tx's change (new config vs the quote's tx).
  // The approve tx mirrors these field-by-field.
  const ratios: SwapFieldRatios = {
    maxFee: fieldRatio(hexToBn(swapEvm.maxFee), next.maxFee),
    maxPriorityFee: fieldRatio(
      hexToBn(swapEvm.maxPriorityFee),
      next.maxPriorityFee
    ),
    gasPrice: fieldRatio(hexToBn(swapEvm.gasPrice), next.gasPrice),
  };

  const originalGas = bnToNum(hexToBn(swapEvm.gas));
  const customGasLimit =
    config.networkFee.gasLimit && config.networkFee.gasLimit !== ''
      ? Number(config.networkFee.gasLimit)
      : null;
  const gasLimitRatio =
    customGasLimit != null && originalGas && originalGas > 0
      ? customGasLimit / originalGas
      : 1;

  const newSwapEvm = applyGasPriceToSwapTx(
    swapEvm,
    next,
    config.networkFee.gasLimit
  );

  const result: Quote2 = {
    ...quote,
    transactionSwap: { ...transactionSwap, evm: newSwapEvm },
  };

  const transactionApprove = quote.transactionApprove;
  if (transactionApprove?.evm) {
    result.transactionApprove = {
      ...transactionApprove,
      evm: scaleApproveTx(transactionApprove.evm, ratios, gasLimitRatio),
    };
  }

  return result;
}
