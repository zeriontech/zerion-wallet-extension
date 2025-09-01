import type { Asset } from 'defi-sdk';
import React from 'react';
import type { FungibleOutline } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { usePreferences } from 'src/ui/features/preferences';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { TextLink } from 'src/ui/ui-kit/TextLink';

export function AssetAnchor({
  asset,
  title,
  address,
}: {
  asset: Pick<Asset, 'symbol' | 'name' | 'id'>;
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
      href={`https://app.zerion.io/explore/asset/${asset.symbol}-${asset.id}?address=${address}`}
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
  fungible,
  title,
}: {
  fungible: FungibleOutline;
  title?: string;
}) {
  const { preferences } = usePreferences();
  const content = title || fungible.symbol || fungible.name;
  if (preferences?.testnetMode?.on) {
    return content;
  }
  return (
    <TextLink
      to={`/asset/${fungible.id}`}
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
