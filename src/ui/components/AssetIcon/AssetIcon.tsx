import React from 'react';
import type { ActionAsset } from 'defi-sdk';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';

export function AssetIcon({
  asset,
  size,
  fallback = null,
}: {
  asset: ActionAsset;
  size: number;
  fallback: React.ReactNode;
}) {
  const fungible = getFungibleAsset(asset);
  const nft = getNftAsset(asset);
  return fungible?.icon_url ? (
    <TokenIcon size={size} src={fungible.icon_url} symbol={fungible.symbol} />
  ) : nft?.icon_url || nft?.collection?.icon_url ? (
    <TokenIcon
      size={size}
      src={nft.icon_url || nft.collection?.icon_url}
      style={{ borderRadius: 4 }}
      symbol={nft.symbol}
    />
  ) : (
    (fallback as React.ReactNode)
  );
}
