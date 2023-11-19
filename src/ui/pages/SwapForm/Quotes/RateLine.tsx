import React from 'react';
import type { Asset } from 'defi-sdk';
import type { SwapFormView } from '@zeriontech/transactions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getError } from 'src/shared/errors/getError';
import { baseToCommon } from 'src/shared/units/convert';
import BigNumber from 'bignumber.js';
import { getDecimals } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { animated, useTransition } from '@react-spring/web';
import type { QuotesData } from './useQuotes';

function getRate({
  spendAsset,
  receiveAsset,
  spendAmountBase,
  receiveAmountBase,
  chain,
}: {
  spendAsset?: Asset;
  receiveAsset?: Asset;
  spendAmountBase?: string;
  receiveAmountBase?: string;
  chain?: Chain;
}) {
  if (
    !spendAsset ||
    !receiveAsset ||
    !spendAmountBase ||
    !receiveAmountBase ||
    !chain
  ) {
    return null;
  }
  // - stable coin on the right side
  // - bigger coin on the left side
  const shouldReverse =
    !spendAsset?.price || !receiveAsset?.price
      ? false
      : spendAsset.type === 'stablecoin' && receiveAsset.type !== 'stablecoin'
      ? true
      : receiveAsset.type === 'stablecoin'
      ? false
      : spendAsset.price.value < receiveAsset.price.value
      ? true
      : false;
  const assets = [spendAsset, receiveAsset];
  const values = [spendAmountBase, receiveAmountBase];
  const [leftAsset, rightAsset] = shouldReverse ? assets.reverse() : assets;
  const [leftValue, rightValue] = shouldReverse ? values.reverse() : values;
  const leftDecimals = getDecimals({ asset: leftAsset, chain });
  const leftValueCommon = baseToCommon(leftValue, leftDecimals);
  const rightDecimals = getDecimals({ asset: rightAsset, chain });
  const rightValueCommon = baseToCommon(rightValue, rightDecimals);
  const rate = new BigNumber(rightValueCommon).div(leftValueCommon);
  return {
    leftAsset,
    rightAsset,
    value: rate,
  };
}

function SlidingRectangle({
  src,
  size,
  render,
}: {
  size: number;
  src: string;
  render: (src: string, index: number) => React.ReactNode;
}) {
  const transitions = useTransition([src], {
    from: { y: size * 0.666, opacity: 0 },
    enter: { y: 0, opacity: 1 },
    leave: { y: 0 - size * 0.666, opacity: 0 },
  });
  return transitions((style, value, _x, index) => (
    <animated.div style={style}>{render(value, index)}</animated.div>
  ));
}

export function RateLine({
  swapView,
  quotesData,
}: {
  swapView: SwapFormView;
  quotesData: QuotesData;
}) {
  const { isLoading, quote, error } = quotesData;
  const { spendPosition, receivePosition } = swapView;

  const rate = getRate({
    spendAsset: spendPosition?.asset,
    receiveAsset: receivePosition?.asset,
    receiveAmountBase: quote?.output_amount_estimation,
    spendAmountBase: quote?.input_amount_estimation,
    chain: quote ? createChain(quote.input_chain) : undefined,
  });

  // If we decide to _not_ circle the images,
  // the gap in the parent HStack needs to be larger
  const shouldCircleProtocolImages = true;
  const gap = shouldCircleProtocolImages ? 4 : 8;
  const protocolBorderRadius = shouldCircleProtocolImages ? '50%' : undefined;

  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      style={{
        visibility: !isLoading && !quote && !error ? 'hidden' : undefined,
      }}
    >
      <UIText kind="small/regular" color="var(--neutral-700)">
        Rate
      </UIText>
      <span>
        {isLoading && !quote ? (
          <span style={{ color: 'var(--neutral-500)' }}>
            Fetching offers...
          </span>
        ) : quote ? (
          <HStack
            // in design it's 4, but design has circle images
            gap={gap}
            style={{
              // Prevent formatted rate text from changing width
              // when the values change. This way, the animated images stay in one place
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {quote.contract_metadata?.icon_url ? (
              <div
                style={{
                  position: 'relative',
                  width: 20,
                  height: 20,
                  // overflow: 'hidden',
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
                        borderRadius: protocolBorderRadius,
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
            {rate ? (
              `1 ${rate.leftAsset.symbol} = ${formatTokenValue(
                rate.value,
                rate.rightAsset.symbol
              )}`
            ) : (
              <span>{quote.contract_metadata?.name ?? 'unknown'}</span>
            )}
          </HStack>
        ) : error ? (
          <UIText kind="small/regular" color="var(--notice-600)">
            {getError(error).message}
          </UIText>
        ) : null}
      </span>
    </HStack>
  );
}
