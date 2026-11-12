import React from 'react';
import type {
  CustomConfiguration,
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NetworkFeeIconBadge } from 'src/ui/pages/SendTransaction/NetworkFee/NetworkFeeIcon';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { noValueDash } from 'src/shared/typography';
import { formatNetworkFee } from '../formatNetworkFee';
import {
  getCustomFeeRatioFromDefaults,
  getNetworkFeeRatioForConfiguration,
  type NetworkFeeQuote,
} from '../getNetworkFeeForSpeed';
import type { CustomFormDefaults } from './NetworkFeeCustomForm';

const PRESETS: { speed: Exclude<NetworkFeeSpeed, 'custom'>; label: string }[] = [
  { speed: 'fast', label: 'Fast' },
  { speed: 'average', label: 'Slow' },
];

const SELECTED_BORDER = '2px solid var(--primary)';
const UNSELECTED_BORDER = '2px solid transparent';

export function NetworkFeeTypeSelector({
  selectedSpeed,
  quote,
  gasPrices,
  baseFee,
  configuration,
  defaults,
  isEip1559,
  fallbackFiatValue = null,
  fallbackSymbol = null,
  currency = null,
  onSelectPreset,
  onSelectCustom,
}: {
  /** Highlights the matching preset (or the Custom button) with a border. */
  selectedSpeed: NetworkFeeSpeed;
  /** The active quote — its `networkFee` is the "fast" price; others scale. */
  quote: NetworkFeeQuote | null;
  gasPrices: ChainGasPrice | null;
  baseFee: number | null;
  configuration?: CustomConfiguration;
  defaults?: CustomFormDefaults;
  isEip1559: boolean;
  fallbackFiatValue?: number | null;
  fallbackSymbol?: string | null;
  currency?: string | null;
  onSelectPreset: (value: NetworkFeeConfiguration) => void;
  onSelectCustom: () => void;
}) {
  const retainedCustom = configuration?.networkFee;
  const hasCustomValues = Boolean(
    retainedCustom?.custom1559GasPrice || retainedCustom?.customClassicGasPrice,
  );
  const customNetworkFee: NetworkFeeConfiguration | null =
    hasCustomValues && retainedCustom
      ? {
          speed: 'custom',
          custom1559GasPrice: retainedCustom.custom1559GasPrice ?? null,
          customClassicGasPrice: retainedCustom.customClassicGasPrice ?? null,
          gasLimit: retainedCustom.gasLimit ?? null,
        }
      : null;
  const customRatio = customNetworkFee
    ? getNetworkFeeRatioForConfiguration(quote, customNetworkFee, gasPrices, baseFee)
    : getCustomFeeRatioFromDefaults(quote, defaults, isEip1559, baseFee);
  const customFeeLabel =
    quote && customRatio != null
      ? formatNetworkFee(quote, customRatio, {
          fallbackFiatValue,
          fallbackSymbol,
          currency,
        })
      : null;

  const displayFeeLabel = (label: string | null) => {
    if (!label || label === noValueDash) {
      return null;
    }
    return label;
  };
  const customFeeText = displayFeeLabel(customFeeLabel);

  return (
    <VStack gap={8}>
      {PRESETS.map(({ speed, label }) => {
        const ratio = getNetworkFeeRatioForConfiguration(
          quote,
          {
            speed,
            custom1559GasPrice: null,
            customClassicGasPrice: null,
            gasLimit: null,
          },
          gasPrices,
          baseFee,
        );
        const feeLabel = quote
          ? formatNetworkFee(quote, ratio, {
              fallbackFiatValue,
              fallbackSymbol,
              currency,
            })
          : null;
        const feeText = displayFeeLabel(feeLabel);
        const eta = gasPrices?.[speed]?.eta;
        const selected = speed === selectedSpeed;
        return (
          <Button
            key={speed}
            type="button"
            kind="neutral"
            size={56}
            aria-pressed={selected}
            style={{
              width: '100%',
              paddingInline: 12,
              border: selected ? SELECTED_BORDER : UNSELECTED_BORDER,
            }}
            onClick={() =>
              onSelectPreset({
                speed,
                custom1559GasPrice: configuration?.networkFee.custom1559GasPrice ?? null,
                customClassicGasPrice: configuration?.networkFee.customClassicGasPrice ?? null,
                gasLimit: null,
              })
            }
          >
            <HStack
              gap={12}
              alignItems="center"
              justifyContent="space-between"
              style={{ width: '100%' }}
            >
              <HStack gap={8} alignItems="center" justifyContent="start">
                <NetworkFeeIconBadge speed={speed} />
                <UIText kind="body/accent">{label}</UIText>
                {eta ? (
                  <UIText kind="body/regular" color="var(--neutral-500)">
                    {`~${formatSeconds(eta)}`}
                  </UIText>
                ) : null}
              </HStack>
              {feeText ? (
                <HStack gap={6} alignItems="center">
                  <UIText kind="caption/accent" color="var(--neutral-500)">
                    {feeText}
                  </UIText>
                  {selected ? (
                    <CheckmarkCheckedIcon
                      aria-hidden="true"
                      style={{
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        color: 'var(--black)',
                        ['--checkmark-tick-color' as string]: 'var(--white)',
                      }}
                    />
                  ) : null}
                </HStack>
              ) : null}
            </HStack>
          </Button>
        );
      })}
      <Button
        type="button"
        kind="neutral"
        size={56}
        aria-pressed={selectedSpeed === 'custom'}
        style={{
          width: '100%',
          paddingInline: 12,
          border: selectedSpeed === 'custom' ? SELECTED_BORDER : UNSELECTED_BORDER,
        }}
        onClick={onSelectCustom}
      >
        <HStack
          gap={12}
          alignItems="center"
          justifyContent="space-between"
          style={{ width: '100%' }}
        >
          <HStack gap={8} alignItems="center" justifyContent="start">
            <NetworkFeeIconBadge speed="custom" />
            <UIText kind="body/accent">Custom</UIText>
          </HStack>
          <HStack gap={6} alignItems="center">
            <UIText kind="caption/accent" color="var(--neutral-500)">
              {customFeeText ?? 'Set your own'}
            </UIText>
            {selectedSpeed === 'custom' ? (
              <CheckmarkCheckedIcon
                aria-hidden="true"
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  color: 'var(--black)',
                  ['--checkmark-tick-color' as string]: 'var(--white)',
                }}
              />
            ) : null}
          </HStack>
        </HStack>
      </Button>
      <Spacer height={12} />
    </VStack>
  );
}
