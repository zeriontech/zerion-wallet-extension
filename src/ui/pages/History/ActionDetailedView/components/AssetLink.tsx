import type { Asset, NFTAsset } from 'defi-sdk';
import React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';

export function AssetLink({
  asset,
  title,
  address,
}: {
  asset: Pick<Asset, 'symbol' | 'name' | 'asset_code'>;
  title?: string;
  address?: string;
}) {
  return (
    <TextAnchor
      href={`https://app.zerion.io/explore/asset/${asset.symbol}-${asset.asset_code}?address=${address}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        openInNewWindow(e);
      }}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        outlineOffset: -1, // make focus ring visible despite overflow: hidden
      }}
    >
      {title || asset.symbol?.toUpperCase() || asset.name}
    </TextAnchor>
  );
}

export function NFTLink({
  nft,
  chain,
  address,
  title,
}: {
  nft: NFTAsset;
  chain?: Chain;
  address?: string;
  title?: string;
}) {
  return (
    <TextAnchor
      href={`https://app.zerion.io/nfts/${
        chain?.toString() || NetworkId.Ethereum
      }/${nft.asset_code}?address=${address}`}
      target="_blank"
      title={nft.name}
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        openInNewWindow(e);
      }}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        outlineOffset: -1, // make focus ring visible despite overflow: hidden
      }}
    >
      {title || nft.name}
    </TextAnchor>
  );
}
