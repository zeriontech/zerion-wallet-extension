import React from 'react';
import type {
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from '@zeriontech/transactions';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NetworkFeeIcon } from 'src/ui/pages/SendTransaction/NetworkFee/NetworkFeeIcon';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { formatNetworkFee } from '../formatNetworkFee';
import {
  getNetworkFeeRatio,
  getPresetEffectiveGasPrice,
  type NetworkFeeQuote,
} from '../getNetworkFeeForSpeed';

const PRESETS: { speed: Exclude<NetworkFeeSpeed, 'custom'>; label: string }[] =
  [
    { speed: 'fast', label: 'Fast' },
    { speed: 'average', label: 'Average' },
  ];

const SELECTED_BORDER = '2px solid var(--primary)';
const UNSELECTED_BORDER = '2px solid transparent';

export function NetworkFeeTypeSelector({
  selectedSpeed,
  quote,
  gasPrices,
  baseFee,
  onSelectPreset,
  onSelectCustom,
}: {
  /** Highlights the matching preset (or the Custom button) with a border. */
  selectedSpeed: NetworkFeeSpeed;
  /** The active quote — its `networkFee` is the "fast" price; others scale. */
  quote: NetworkFeeQuote | null;
  gasPrices: ChainGasPrice | null;
  baseFee: number | null;
  onSelectPreset: (value: NetworkFeeConfiguration) => void;
  onSelectCustom: () => void;
}) {
  return (
    <VStack gap={8}>
      {PRESETS.map(({ speed, label }) => {
        const effective = getPresetEffectiveGasPrice(speed, gasPrices, baseFee);
        const ratio = getNetworkFeeRatio(quote, effective, baseFee);
        const feeLabel = quote ? formatNetworkFee(quote, ratio) : null;
        return (
          <Button
            key={speed}
            type="button"
            kind="neutral"
            size={56}
            style={{
              width: '100%',
              paddingInline: 12,
              border:
                speed === selectedSpeed ? SELECTED_BORDER : UNSELECTED_BORDER,
            }}
            onClick={() =>
              onSelectPreset({
                speed,
                custom1559GasPrice: null,
                customClassicGasPrice: null,
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
              <HStack gap={12} alignItems="center" justifyContent="start">
                <NetworkFeeIcon
                  speed={speed}
                  style={{ width: 24, height: 24 }}
                />
                <UIText kind="body/accent">{label}</UIText>
              </HStack>
              {feeLabel ? (
                <UIText kind="caption/accent" color="var(--black)">
                  ~{feeLabel}
                </UIText>
              ) : null}
            </HStack>
          </Button>
        );
      })}
      <Button
        type="button"
        kind="neutral"
        size={56}
        style={{
          width: '100%',
          paddingInline: 12,
          border:
            selectedSpeed === 'custom' ? SELECTED_BORDER : UNSELECTED_BORDER,
        }}
        onClick={onSelectCustom}
      >
        <HStack gap={12} alignItems="center" justifyContent="start">
          <NetworkFeeIcon speed="custom" style={{ width: 24, height: 24 }} />
          <UIText kind="body/accent">Custom</UIText>
        </HStack>
      </Button>
      <Spacer height={12} />
    </VStack>
  );
}
