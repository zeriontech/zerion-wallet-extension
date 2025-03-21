import type { Asset } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { isNumeric } from 'src/shared/isNumeric';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';

const LOW_LOSS_RATIO = -0.05;
const HIGH_LOSS_RATIO = -0.15;

type PriceImpactLevel = 'low' | 'medium' | 'high';

export type PriceImpact =
  | { kind: 'n/a' }
  | {
      kind: 'profit';
      ratio: BigNumber;
      percentage: string;
    }
  | {
      kind: 'zero';
    }
  | {
      kind: 'loss';
      level: PriceImpactLevel;
      ratio: BigNumber;
      percentage: string;
    };

function toPercentage(ratio: BigNumber) {
  return `${ratio.isLessThan(0) ? '' : '+'}${formatPercent(
    ratio.times(100),
    'en'
  )}%`;
}

function ratioToPriceImpact(ratio: BigNumber | null): PriceImpact {
  // x > 0 => profit
  // x = 0 => no impact
  // -0.05 <= x < 0 => low loss
  // -0.15 <= x < -0.05 => medium loss
  // x < -0.15 => high loss

  if (ratio == null) {
    return { kind: 'n/a' };
  } else if (ratio.isGreaterThan(0)) {
    return { kind: 'profit', ratio, percentage: toPercentage(ratio) };
  } else if (ratio.isZero()) {
    return { kind: 'zero' };
  } else {
    const percentage = toPercentage(ratio);
    if (ratio.isGreaterThanOrEqualTo(LOW_LOSS_RATIO)) {
      return { kind: 'loss', level: 'low', ratio, percentage };
    } else if (ratio.isGreaterThanOrEqualTo(HIGH_LOSS_RATIO)) {
      return { kind: 'loss', level: 'medium', ratio, percentage };
    } else {
      return { kind: 'loss', level: 'high', ratio, percentage };
    }
  }
}

function toFiatValue(value: string | null, asset: Asset | null) {
  return new BigNumber(value || 0).times(asset?.price?.value || 0);
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
  const inputFiatValue = toFiatValue(inputValue, inputAsset);
  const outputFiatValue = toFiatValue(outputValue, outputAsset);
  const ratio = outputFiatValue.isGreaterThan(0)
    ? inputFiatValue.minus(outputFiatValue).div(outputFiatValue)
    : null;
  return ratioToPriceImpact(ratio);
}
