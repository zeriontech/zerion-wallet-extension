import React, { useMemo } from 'react';
import type { AddressAction } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { AssetLink } from './AssetLink';

export function RateLine({
  action,
  address,
}: {
  action: AddressAction;
  address?: string;
}) {
  const rate = useMemo(() => {
    const { content } = action;
    const type = action.type.value;
    const incomingFungible = getFungibleAsset(
      content?.transfers?.incoming?.[0]?.asset
    );
    const outgoingFungible = getFungibleAsset(
      content?.transfers?.outgoing?.[0]?.asset
    );

    const incomingPrice = content?.transfers?.incoming?.[0]?.price || 0;
    const outgoingPrice = content?.transfers?.outgoing?.[0]?.price || 0;

    return type === 'trade' &&
      content?.transfers?.incoming?.length === 1 &&
      incomingFungible &&
      content?.transfers?.outgoing?.length === 1 &&
      outgoingFungible
      ? incomingFungible.type === 'stablecoin' || outgoingPrice > incomingPrice
        ? {
            asset1: outgoingFungible,
            price1: outgoingPrice,
            asset2: incomingFungible,
            price2: incomingPrice,
          }
        : {
            asset1: incomingFungible,
            price1: incomingPrice,
            asset2: outgoingFungible,
            price2: outgoingPrice,
          }
      : null;
  }, [action]);

  if (!rate?.price1 || !rate.price2) {
    return null;
  }

  const ratio = new BigNumber(rate.price1).div(rate.price2);

  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">Rate</UIText>
      <UIText kind="small/accent" style={{ justifySelf: 'end' }}>
        <HStack gap={4}>
          <span>1</span>
          <AssetLink asset={rate.asset1} address={address} />
          <span>=</span>
          <span>{formatTokenValue(ratio, '')}</span>
          <AssetLink asset={rate.asset2} address={address} />
        </HStack>
      </UIText>
    </HStack>
  );
}
