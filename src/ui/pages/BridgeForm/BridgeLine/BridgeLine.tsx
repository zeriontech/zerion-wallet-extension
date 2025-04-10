import { useAssetsPrices, type Asset } from 'defi-sdk';
import React, { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Chain } from 'src/modules/networks/Chain';
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Quote } from 'src/shared/types/Quote';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { SlidingRectangle } from 'src/ui/components/SlidingRectangle';
import { noValueDash } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { getQuotesErrorMessage } from '../../SwapForm/Quotes/getQuotesErrorMessage';

function getFeePriceValue({
  quote,
  chain,
  asset,
}: {
  quote: Quote;
  chain: Chain;
  asset: Asset;
}) {
  if (asset.price?.value == null) {
    return null;
  }

  const quantity = getCommonQuantity({
    baseQuantity: quote.bridge_fee_amount,
    chain,
    asset,
  });

  return quantity.times(asset.price.value);
}

export function BridgeLine({
  spendChain,
  quotesData,
  quote,
}: {
  spendChain: Chain;
  quotesData: QuotesData;
  quote: Quote | null;
}) {
  const { isLoading, error } = quotesData;

  const { currency } = useCurrency();
  const { value: feeAssetValue } = useAssetsPrices({
    asset_codes: [quote?.bridge_fee_asset_id || ''],
    currency,
  });

  const feeAssetId = quote?.bridge_fee_asset_id;
  const feeAsset = feeAssetId ? feeAssetValue?.[feeAssetId] : undefined;
  const feePriceValue = useMemo(
    () =>
      quote && feeAsset
        ? getFeePriceValue({
            quote,
            chain: spendChain,
            asset: feeAsset,
          })
        : null,
    [feeAsset, quote, spendChain]
  );

  return (
    <HStack
      gap={12}
      justifyContent="space-between"
      alignItems="center"
      style={{
        visibility: !isLoading && !quote && !error ? 'hidden' : undefined,
      }}
    >
      <UIText kind="small/regular" color="var(--neutral-700)">
        Bridge
      </UIText>
      <span>
        {isLoading && !quote ? (
          <span style={{ color: 'var(--neutral-500)' }}>
            Fetching offers...
          </span>
        ) : quote ? (
          <HStack
            gap={4}
            style={{
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {quote.contract_metadata?.icon_url ? (
              <div
                style={{
                  position: 'relative',
                  width: 20,
                  height: 20,
                }}
              >
                <SlidingRectangle
                  size={20}
                  src={quote.contract_metadata.icon_url}
                  render={(src, index) => (
                    <img
                      title={quote.contract_metadata?.name}
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
                      alt={`${quote.contract_metadata?.name} logo`}
                    />
                  )}
                />
              </div>
            ) : null}

            <HStack gap={4} alignItems="center">
              <UIText kind="small/accent">
                {quote?.seconds_estimation
                  ? `~${formatSeconds(Number(quote.seconds_estimation))}`
                  : noValueDash}
              </UIText>
              <UIText kind="small/accent">·</UIText>
              {feeAsset && feePriceValue ? (
                <HStack gap={4} alignItems="center">
                  <UIText kind="small/accent">
                    {formatCurrencyValue(feePriceValue, 'en', currency)}
                  </UIText>
                  <UIText kind="small/accent">·</UIText>
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
        ) : error ? (
          <UIText kind="small/regular" color="var(--notice-600)">
            {getQuotesErrorMessage(quotesData)}
          </UIText>
        ) : null}
      </span>
    </HStack>
  );
}
