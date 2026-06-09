import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export type TradeMode = 'open' | 'add' | 'close';
export type TradeSide = 'long' | 'short';

export interface TradeFormState {
  mode: TradeMode | null;
  side: TradeSide | null;
  inputAmount: string;
  leverage: number | null;
  takeProfitPrice: string;
  stopLossPrice: string;
}

const KEYS = [
  'mode',
  'side',
  'inputAmount',
  'leverage',
  'takeProfitPrice',
  'stopLossPrice',
] as const;

function parseMode(value: string | null): TradeMode | null {
  return value === 'open' || value === 'add' || value === 'close'
    ? value
    : null;
}

function parseSide(value: string | null): TradeSide | null {
  return value === 'long' || value === 'short' ? value : null;
}

function parseLeverage(value: string | null): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function useTradeFormState() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const state = useMemo<TradeFormState>(
    () => ({
      mode: parseMode(searchParams.get('mode')),
      side: parseSide(searchParams.get('side')),
      inputAmount: searchParams.get('inputAmount') ?? '',
      leverage: parseLeverage(searchParams.get('leverage')),
      takeProfitPrice: searchParams.get('takeProfitPrice') ?? '',
      stopLossPrice: searchParams.get('stopLossPrice') ?? '',
    }),
    [searchParams]
  );

  const updateState = useCallback(
    (patch: Partial<TradeFormState>, options?: { replace?: boolean }) => {
      const next = new URLSearchParams(searchParams);
      for (const key of KEYS) {
        if (!(key in patch)) continue;
        const value = patch[key];
        if (
          value === null ||
          value === undefined ||
          (typeof value === 'string' && value === '')
        ) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      navigate(
        { search: next.toString() ? `?${next.toString()}` : '' },
        { replace: options?.replace ?? true }
      );
    },
    [navigate, searchParams]
  );

  const clearForm = useCallback(
    (options?: { replace?: boolean }) => {
      const next = new URLSearchParams(searchParams);
      for (const key of KEYS) next.delete(key);
      navigate(
        { search: next.toString() ? `?${next.toString()}` : '' },
        { replace: options?.replace ?? true }
      );
    },
    [navigate, searchParams]
  );

  return { state, updateState, clearForm };
}
