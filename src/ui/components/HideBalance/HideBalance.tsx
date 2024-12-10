import { useStore } from '@store-unit/react';
import type BigNumber from 'bignumber.js';
import React from 'react';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import {
  HideBalanceMode,
  hideBalancesStore,
} from 'src/ui/features/hide-balances/store';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { BlurWithPixels } from './BlurWithPixels';

function reduceValue(value: number, target = 50) {
  do {
    value = value / 10;
  } while (Math.abs(value) > target);
  return value;
}

function shuffle(value: number) {
  return value * Math.PI;
}

function hideBalance(
  value: number,
  currency: string,
  mode: HideBalanceMode
): number {
  if (mode === HideBalanceMode.poorMode2) {
    return value / 10;
  } else if (mode === HideBalanceMode.poorMode3) {
    return value / 100;
  } else {
    if (currency === 'btc') {
      return shuffle(reduceValue(value, 0.001));
    }
    return shuffle(reduceValue(value));
  }
}

function isPoorMode(mode: HideBalanceMode) {
  return (
    mode === hideBalancesStore.MODE.poorMode1 ||
    mode === hideBalancesStore.MODE.poorMode2 ||
    mode === hideBalancesStore.MODE.poorMode3
  );
}

export function HideBalance({
  value: originalValue,
  children,
  kind = 'currencyValue',
  locale = 'en',
  currency = 'usd',
  symbol = '',
}: React.PropsWithChildren<{
  value: string | number | BigNumber;
  locale?: string;
  currency?: string;
  kind?: 'NeutralDecimals' | 'currencyValue' | 'tokenValue';
  symbol?: string;
}>) {
  const { mode } = useStore(hideBalancesStore);
  if (mode === hideBalancesStore.MODE.default) {
    return children;
  } else if (isPoorMode(mode)) {
    const fakeValue = hideBalance(Number(originalValue), currency, mode);
    if (kind === 'NeutralDecimals') {
      return (
        <NeutralDecimals
          parts={formatCurrencyToParts(fakeValue, locale, currency)}
        />
      );
    } else if (kind === 'currencyValue') {
      return <span>{formatCurrencyValue(fakeValue, locale, currency)}</span>;
    } else if (kind === 'tokenValue') {
      return <span>{formatTokenValue(fakeValue, symbol)}</span>;
    }
  } else if (mode === hideBalancesStore.MODE.blurred) {
    return <BlurWithPixels />;
  }
}
