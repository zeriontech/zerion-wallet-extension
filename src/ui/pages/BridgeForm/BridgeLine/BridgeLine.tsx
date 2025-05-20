import { useAssetsPrices } from 'defi-sdk';
import React, { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Chain } from 'src/modules/networks/Chain';
import type { Quote } from 'src/shared/types/Quote';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { SlidingRectangle } from 'src/ui/components/SlidingRectangle';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { noValueDash } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { getQuotesErrorMessage } from '../../SwapForm/Quotes/getQuotesErrorMessage';
import { getBridgeFeeValueFiat } from '../shared/getBridgeFeeValueFiat';

export function BridgeLine({
  spendChain,
  quotesData,
  selectedQuote,
  onQuoteSelect,
}: {
  spendChain: Chain;
  quotesData: QuotesData;
  selectedQuote: Quote | null;
  onQuoteSelect: () => void;
}) {
  const { isLoading, error } = quotesData;

  const { currency } = useCurrency();
  const { value: feeAssetValue } = useAssetsPrices({
    asset_codes: [selectedQuote?.bridge_fee_asset_id || ''],
    currency,
  });

  const feeAssetId = selectedQuote?.bridge_fee_asset_id;
  const feeAsset = feeAssetId ? feeAssetValue?.[feeAssetId] : undefined;
  const feePriceValue = useMemo(
    () =>
      selectedQuote && feeAsset
        ? getBridgeFeeValueFiat({
            quote: selectedQuote,
            chain: spendChain,
            asset: feeAsset,
          })
        : null,
    [feeAsset, selectedQuote, spendChain]
  );

  return (
    <HStack
      gap={12}
      justifyContent="space-between"
      alignItems="center"
      style={{
        visibility:
          !isLoading && !selectedQuote && !error ? 'hidden' : undefined,
      }}
    >
      <UIText kind="small/regular">Bridge</UIText>
      <span>
        {isLoading && !selectedQuote ? (
          <span style={{ color: 'var(--neutral-500)' }}>
            Fetching offers...
          </span>
        ) : selectedQuote ? (
          <UnstyledButton
            style={{ display: 'flex' }}
            onClick={() => onQuoteSelect()}
            title="Select quote"
          >
            <HStack
              gap={4}
              style={{
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {selectedQuote.contract_metadata?.icon_url ? (
                <div
                  style={{
                    position: 'relative',
                    width: 20,
                    height: 20,
                  }}
                >
                  <SlidingRectangle
                    size={20}
                    src={selectedQuote.contract_metadata.icon_url}
                    render={(src, index) => (
                      <img
                        title={selectedQuote.contract_metadata?.name}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          zIndex: index,
                        }}
                        src={src}
                        // The alt here may be from a sibling image, but hopefully it doesn't matter
                        alt={`${selectedQuote.contract_metadata?.name} logo`}
                      />
                    )}
                  />
                </div>
              ) : null}

              <HStack gap={4} alignItems="center">
                <UIText kind="small/accent" color="var(--primary)">
                  {selectedQuote?.seconds_estimation
                    ? `~${formatSeconds(
                        Number(selectedQuote.seconds_estimation)
                      )}`
                    : noValueDash}
                </UIText>
                <UIText kind="small/accent" color="var(--primary)">
                  ·
                </UIText>
                {feeAsset && feePriceValue ? (
                  <HStack gap={4} alignItems="center">
                    <UIText kind="small/accent" color="var(--primary)">
                      {formatCurrencyValue(feePriceValue, 'en', currency)}
                    </UIText>
                    <UIText kind="small/accent" color="var(--primary)">
                      ·
                    </UIText>
                    <TokenIcon
                      size={16}
                      src={feeAsset.icon_url}
                      symbol={feeAsset.symbol}
                    />
                    <UIText color="var(--black)" kind="small/accent">
                      {feeAsset.symbol}
                    </UIText>
                  </HStack>
                ) : (
                  <UIText
                    kind="small/accent"
                    style={{
                      background:
                        'linear-gradient(113deg, #20DBE7 6.71%, #4B7AEF 58.69%, #BC29EF 102.67%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Free
                  </UIText>
                )}
              </HStack>
            </HStack>
          </UnstyledButton>
        ) : error ? (
          <UIText kind="small/regular" color="var(--notice-600)">
            {getQuotesErrorMessage(quotesData)}
          </UIText>
        ) : null}
      </span>
    </HStack>
  );
}
