import { formatOrderPrice, formatOrderSize } from './formatOrderPriceAndSize';

export function calculatePositionSize({
  margin,
  leverage,
  entryPrice,
  szDecimals,
}: {
  margin: number;
  leverage: number;
  entryPrice: number;
  szDecimals: number;
}): number {
  const formattedPrice = formatOrderPrice(entryPrice, szDecimals);
  if (formattedPrice === 0) return 0;
  const positionValue = margin * leverage;
  const rawSize = positionValue / formattedPrice;
  return formatOrderSize(rawSize, szDecimals);
}
