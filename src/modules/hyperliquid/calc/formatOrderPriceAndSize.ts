// Hyperliquid tick/lot rules:
// - Price: max 5 significant figures AND max (6 - szDecimals) decimal places.
//   Integer prices always allowed regardless of sig figs.
// - Size: rounded to szDecimals.
// Reference: iOS PerpetualOrderUtils.formatOrderPrice / formatOrderSize.

const PRICE_MAX_DECIMALS = 6;
const PRICE_MAX_SIG_FIGS = 5;

function toSignificantDigits(value: number, sigFigs: number): number {
  if (value === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, sigFigs - 1 - magnitude);
  return Math.round(value * factor) / factor;
}

export function formatOrderPrice(price: number, szDecimals: number): number {
  const allowedDecimals = Math.max(0, PRICE_MAX_DECIMALS - szDecimals);

  const rounded = Math.round(price);
  if (Math.abs(price - rounded) < 1e-10) {
    return rounded;
  }

  // Step 1: limit to 5 significant figures.
  const sigFigValue = toSignificantDigits(price, PRICE_MAX_SIG_FIGS);

  // Step 2: clamp to allowed decimal places.
  const multiplier = Math.pow(10, allowedDecimals);
  return Math.round(sigFigValue * multiplier) / multiplier;
}

export function formatOrderSize(size: number, szDecimals: number): number {
  const multiplier = Math.pow(10, szDecimals);
  return Math.round(size * multiplier) / multiplier;
}
