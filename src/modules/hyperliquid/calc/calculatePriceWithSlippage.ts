import { DEFAULT_SLIPPAGE } from '../constants';
import { formatOrderPrice } from './formatOrderPriceAndSize';

export function calculatePriceWithSlippage({
  basePrice,
  isLong,
  szDecimals,
  slippage = DEFAULT_SLIPPAGE,
}: {
  basePrice: number;
  isLong: boolean;
  szDecimals: number;
  slippage?: number;
}): number {
  const formattedBasePrice = formatOrderPrice(basePrice, szDecimals);
  const slippageMultiplier = 1 + slippage;
  const raw = isLong
    ? formattedBasePrice * slippageMultiplier
    : formattedBasePrice / slippageMultiplier;
  return formatOrderPrice(raw, szDecimals);
}
