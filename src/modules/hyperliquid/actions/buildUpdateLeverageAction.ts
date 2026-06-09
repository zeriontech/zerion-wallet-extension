import type { ExchangeUpdateLeverageAction } from './types';

export function buildUpdateLeverageAction({
  asset,
  isCross,
  leverage,
}: {
  asset: number;
  isCross: boolean;
  leverage: number;
}): ExchangeUpdateLeverageAction {
  return {
    type: 'updateLeverage',
    asset,
    isCross,
    leverage,
  };
}
