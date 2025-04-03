import type { Asset } from 'defi-sdk';
import React from 'react';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { usePreferences } from 'src/ui/features/preferences';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { TextLink } from 'src/ui/ui-kit/TextLink';

export function AssetAnchor({
  asset,
  title,
  address,
}: {
  asset: Pick<Asset, 'symbol' | 'name' | 'asset_code'>;
  title?: string;
  address?: string;
}) {
  const { preferences } = usePreferences();
  const content = title || asset.symbol || asset.name;
  if (preferences?.testnetMode?.on) {
    return content;
  }
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
      {content}
    </TextAnchor>
  );
}

export function AssetLink({
  asset,
  title,
  address,
}: {
  asset: Pick<Asset, 'symbol' | 'name' | 'asset_code'>;
  title?: string;
  address?: string;
}) {
  const { preferences } = usePreferences();
  const { data: assetPageEnabled, isLoading } = useRemoteConfigValue(
    'extension_asset_page_enabled'
  );
  const content = title || asset.symbol || asset.name;
  if (preferences?.testnetMode?.on) {
    return content;
  }
  if (isLoading || !assetPageEnabled) {
    return <AssetAnchor asset={asset} title={title} address={address} />;
  }
  return (
    <TextLink
      to={`/asset/${asset.asset_code}`}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        outlineOffset: -1, // make focus ring visible despite overflow: hidden
      }}
    >
      {content}
    </TextLink>
  );
}
