import type { Asset } from 'defi-sdk';
import React from 'react';
import { usePreferences } from 'src/ui/features/preferences';
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
