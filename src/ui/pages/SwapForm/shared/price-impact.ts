import type { Asset } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { isNumeric } from 'src/shared/isNumeric';

const LOW_LOSS_RATIO = -0.05;
const HIGH_LOSS_RATIO = -0.15;

type PriceImpactLevel = 'low' | 'medium' | 'high';

export type PriceImpact =
  | { kind: 'n/a' }
  | {
      kind: 'profit';
      ratio: number;
    }
  | {
      kind: 'zero';
    }
  | {
      kind: 'loss';
      level: PriceImpactLevel;
      ratio: number;
    };

function ratioToPriceImpact(ratio: number | null): PriceImpact {
  // x > 0 => profit
  // x = 0 => no impact
  // -0.05 <= x < 0 => low loss
  // -0.15 <= x < -0.05 => medium loss
  // x < -0.15 => high loss

  if (ratio == null) {
    return { kind: 'n/a' };
  } else if (ratio > 0) {
    return { kind: 'profit', ratio };
  } else if (ratio === 0) {
    return { kind: 'zero' };
  } else if (ratio >= LOW_LOSS_RATIO) {
    return { kind: 'loss', level: 'low', ratio };
  } else if (ratio >= HIGH_LOSS_RATIO) {
    return { kind: 'loss', level: 'medium', ratio };
  } else {
    return { kind: 'loss', level: 'high', ratio };
  }
}

function toFiatValue(value: string | null, price: number) {
  return new BigNumber(value || 0).times(price);
}

export function calculatePriceImpact({
  inputValue,
  outputValue,
  inputAsset,
  outputAsset,
}: {
  inputValue: string | null;
  outputValue: string | null;
  inputAsset: Asset | null;
  outputAsset: Asset | null;
}): PriceImpact | null {
  if (inputValue == null || !isNumeric(inputValue)) {
    return null;
  }

  if (!inputAsset?.price || !outputAsset?.price) {
    return ratioToPriceImpact(null);
  }

  const inputFiatValue = toFiatValue(inputValue, inputAsset.price.value);
  const outputFiatValue = toFiatValue(outputValue, outputAsset.price.value);

  const ratio =
    outputFiatValue.isGreaterThan(0) && inputFiatValue.isGreaterThan(0)
      ? outputFiatValue.minus(inputFiatValue).div(inputFiatValue).toNumber()
      : null;

  return ratioToPriceImpact(ratio);
}

export function getPriceImpactPercentage(priceImpact: PriceImpact) {
  if (priceImpact.kind === 'zero') {
    return 0;
  } else if (priceImpact.kind === 'loss' || priceImpact.kind === 'profit') {
    return priceImpact.ratio * 100;
  } else {
    return null;
  }
}
