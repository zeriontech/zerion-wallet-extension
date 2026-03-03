import React from 'react';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { useSelect } from 'downshift';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { NBSP } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { PnlMode } from 'src/background/Wallet/model/types';
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';
import type { WalletPnL } from 'src/modules/zerion-api/requests/wallet-get-pnl';
import { usePreferences } from 'src/ui/features/preferences';
import { BadgeTrigger } from './BadgeTrigger';
import * as styles from './PercentageChange.module.css';

const PNL_OPTIONS: Array<{ id: PnlMode; label: string; shortLabel: string }> = [
  { id: 'pnl', label: 'Total PnL', shortLabel: 'PnL' },
  { id: 'rpnl', label: 'Realized PnL', shortLabel: 'rPnL' },
  { id: 'upnl', label: 'Unrealized PnL', shortLabel: 'uPnL' },
  { id: '1day', label: '1 Day', shortLabel: '24h' },
];

interface PercentChangeInfo {
  isPositive: boolean;
  isNonNegative: boolean;
  formatted: string;
}

function formatPercentChange(value: number, locale: string): PercentChangeInfo {
  return {
    isPositive: value > 0,
    isNonNegative: value >= 0,
    formatted: `${formatPercent(value, locale)}%`,
  };
}

function getRelativeValue(
  mode: PnlMode,
  walletPortfolio: WalletPortfolio | undefined,
  walletPnl: WalletPnL | undefined
): number | null {
  switch (mode) {
    case 'pnl':
      return walletPnl != null ? walletPnl.relativeTotalPnl * 100 : null;
    case 'rpnl':
      return walletPnl != null ? walletPnl.relativeRealizedPnl * 100 : null;
    case 'upnl':
      return walletPnl != null ? walletPnl.relativeUnrealizedPnl * 100 : null;
    case '1day':
      return walletPortfolio?.change24h.relative ?? null;
  }
}

function getAbsoluteValue(
  mode: PnlMode,
  walletPortfolio: WalletPortfolio | undefined,
  walletPnl: WalletPnL | undefined
): number | null {
  switch (mode) {
    case 'pnl':
      return walletPnl?.totalPnl ?? null;
    case 'rpnl':
      return walletPnl?.realizedPnl ?? null;
    case 'upnl':
      return walletPnl?.unrealizedPnl ?? null;
    case '1day':
      return walletPortfolio?.change24h.absolute ?? null;
  }
}

interface Props {
  walletPortfolio: WalletPortfolio | undefined;
  walletPnl: WalletPnL | undefined;
  currency: string;
}

export function PercentageChange({
  walletPortfolio,
  walletPnl,
  currency,
}: Props) {
  const { preferences, setPreferences } = usePreferences();
  const selectedMode: PnlMode = preferences?.pnlMode ?? 'pnl';

  const currentOption =
    PNL_OPTIONS.find((o) => o.id === selectedMode) ?? PNL_OPTIONS[0];

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    highlightedIndex,
  } = useSelect({
    items: PNL_OPTIONS,
    selectedItem: currentOption,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setPreferences({ pnlMode: selectedItem.id });
      }
    },
    itemToString: (item) => item?.label ?? '',
  });

  const relativeValue = getRelativeValue(
    selectedMode,
    walletPortfolio,
    walletPnl
  );
  const percentageChange =
    relativeValue != null ? formatPercentChange(relativeValue, 'en') : null;

  const absoluteValue = getAbsoluteValue(
    selectedMode,
    walletPortfolio,
    walletPnl
  );

  return (
    <VStack gap={0}>
      <BlurrableBalance kind="headline/h1" color="var(--black)">
        <UIText kind="headline/h1">
          {walletPortfolio?.totalValue != null ? (
            <NeutralDecimals
              parts={formatCurrencyToParts(
                walletPortfolio.totalValue,
                'en',
                currency
              )}
            />
          ) : (
            NBSP
          )}
        </UIText>
      </BlurrableBalance>
      <HStack alignItems="center" gap={4}>
        {percentageChange ? (
          <UIText
            kind="small/regular"
            color={
              percentageChange.isNonNegative
                ? 'var(--positive-500)'
                : 'var(--negative-500)'
            }
            style={{ display: 'flex', gap: 4 }}
          >
            <span>
              {`${percentageChange.isPositive ? '+' : ''}${
                percentageChange.formatted
              }`}
            </span>
            {absoluteValue != null ? (
              <BlurrableBalance
                kind="small/regular"
                color={
                  percentageChange.isNonNegative
                    ? 'var(--positive-500)'
                    : 'var(--negative-500)'
                }
              >
                {`(${formatCurrencyValue(
                  Math.abs(absoluteValue),
                  'en',
                  currency
                )})`}
              </BlurrableBalance>
            ) : null}
          </UIText>
        ) : (
          <UIText kind="small/regular">{NBSP}</UIText>
        )}
        <div style={{ position: 'relative' }}>
          <button
            {...getToggleButtonProps()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <BadgeTrigger isOpen={isOpen}>
              {currentOption.shortLabel}
            </BadgeTrigger>
          </button>
          <ul
            {...getMenuProps()}
            className={styles.menu}
            style={{ display: isOpen ? 'block' : 'none' }}
          >
            {PNL_OPTIONS.map((option, index) => {
              const optionRelativeValue = getRelativeValue(
                option.id,
                walletPortfolio,
                walletPnl
              );
              const optionAbsoluteValue = getAbsoluteValue(
                option.id,
                walletPortfolio,
                walletPnl
              );
              const optionPercentageChange =
                optionRelativeValue != null
                  ? formatPercentChange(optionRelativeValue, 'en')
                  : null;
              return (
                <li
                  key={option.id}
                  {...getItemProps({ item: option, index })}
                  className={
                    highlightedIndex === index
                      ? `${styles.menuItem} ${styles.menuItemHighlighted}`
                      : styles.menuItem
                  }
                >
                  <div>
                    <UIText kind="small/regular">{option.label}</UIText>
                    {optionPercentageChange ? (
                      <UIText
                        kind="caption/regular"
                        color={
                          optionPercentageChange.isNonNegative
                            ? 'var(--positive-500)'
                            : 'var(--negative-500)'
                        }
                        style={{ display: 'flex', gap: 4 }}
                      >
                        <span>
                          {`${optionPercentageChange.isPositive ? '+' : ''}${
                            optionPercentageChange.formatted
                          }`}
                        </span>
                        {optionAbsoluteValue != null ? (
                          <span>
                            {`(${formatCurrencyValue(
                              Math.abs(optionAbsoluteValue),
                              'en',
                              currency
                            )})`}
                          </span>
                        ) : null}
                      </UIText>
                    ) : null}
                  </div>
                  {selectedMode === option.id ? (
                    <CheckIcon
                      style={{
                        width: 16,
                        height: 16,
                        color: 'var(--primary)',
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </HStack>
    </VStack>
  );
}
