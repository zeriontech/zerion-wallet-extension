import type { PerpFill } from './api/requests/perp-user-fills.types';

export interface FillKind {
  label: string;
  isLiquidation: boolean;
  isOpen: boolean;
  isLong: boolean;
}

export function classifyFill(fill: PerpFill): FillKind {
  const dir = fill.dir;
  const lowered = dir.toLowerCase();
  const isLong = lowered.includes('long');
  if (fill.liquidation) {
    return { label: 'Liquidation', isLiquidation: true, isOpen: false, isLong };
  }
  return {
    label: dir,
    isLiquidation: false,
    isOpen: lowered.startsWith('open'),
    isLong,
  };
}
