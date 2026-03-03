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
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';
import type { WalletPnL } from 'src/modules/zerion-api/requests/wallet-get-pnl';
import { usePreferences } from 'src/ui/features/preferences';
import { BadgeTrigger } from './BadgeTrigger';

type PnlMode = 'pnl' | 'rpnl' | 'upnl' | '1day';

const PNL_OPTIONS: Array<{ id: PnlMode; label: string; shortLabel: string }> = [
  { id: 'pnl', label: 'Total PnL', shortLabel: 'PnL' },
  { id: 'rpnl', label: 'Realized PnL', shortLabel: 'rPnL' },
  { id: 'upnl', label: 'Unrealized PnL', shortLabel: 'uPnL' },
  { id: '1day', label: '1 Day', shortLabel: '24h' },
];

interface PercentChangeInfo {
  isPositive: boolean;
  isNegative: boolean;
  isNonNegative: boolean;
  isZero: boolean;
  formatted: string;
}

function formatPercentChange(value: number, locale: string): PercentChangeInfo {
  return {
    isPositive: value > 0,
    isNonNegative: value >= 0,
    isNegative: value < 0,
    isZero: value === 0,
    formatted: `${formatPercent(value, locale)}%`,
  };
}

function getRelativeValue(
  mode: PnlMode,
  walletPortfolio: WalletPortfolio | undefined,
  walletPnl: WalletPnL | null | undefined
): number | null {
  switch (mode) {
    case 'pnl':
      return walletPnl?.relativeTotalPnl != null
        ? walletPnl.relativeTotalPnl * 100
        : null;
    case 'rpnl':
      return walletPnl?.relativeRealizedPnl != null
        ? walletPnl.relativeRealizedPnl * 100
        : null;
    case 'upnl':
      return walletPnl?.relativeUnrealizedPnl != null
        ? walletPnl.relativeUnrealizedPnl * 100
        : null;
    case '1day':
      return walletPortfolio?.change24h.relative ?? null;
  }
}

function getAbsoluteValue(
  mode: PnlMode,
  walletPortfolio: WalletPortfolio | undefined,
  walletPnl: WalletPnL | null | undefined
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
  walletPnl: WalletPnL | null | undefined;
  currency: string;
}

export function PercentageChange({
  walletPortfolio,
  walletPnl,
  currency,
}: Props) {
  const { preferences, setPreferences } = usePreferences();
  const selectedMode: PnlMode = preferences?.pnlMode ?? 'pnl';

  const currentOption = PNL_OPTIONS.find((o) => o.id === selectedMode)!;

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
            style={{
              display: isOpen ? 'block' : 'none',
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              zIndex: 100,
              backgroundColor: 'var(--white)',
              border: '1px solid var(--neutral-200)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              minWidth: 160,
              listStyle: 'none',
              margin: 0,
              padding: '4px 0',
            }}
          >
            {PNL_OPTIONS.map((option, index) => {
              const optionAbsoluteValue = getAbsoluteValue(
                option.id,
                walletPortfolio,
                walletPnl
              );
              return (
                <li
                  key={option.id}
                  {...getItemProps({ item: option, index })}
                  style={{
                    backgroundColor:
                      highlightedIndex === index
                        ? 'var(--neutral-100)'
                        : undefined,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <UIText kind="small/regular">{option.label}</UIText>
                    {optionAbsoluteValue != null ? (
                      <UIText
                        kind="caption/regular"
                        color={
                          optionAbsoluteValue >= 0
                            ? 'var(--positive-500)'
                            : 'var(--negative-500)'
                        }
                      >
                        {`${
                          optionAbsoluteValue >= 0 ? '+' : '-'
                        }${formatCurrencyValue(
                          Math.abs(optionAbsoluteValue),
                          'en',
                          currency
                        )}`}
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
