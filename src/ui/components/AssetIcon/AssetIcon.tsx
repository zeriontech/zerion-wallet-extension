import React from 'react';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import type {
  Collection,
  FungibleOutline,
  NFTPreview,
} from 'src/modules/zerion-api/requests/wallet-get-actions';

export function AssetIcon({
  fungible,
  nft,
  collection,
  size,
  fallback = null,
}: {
  fungible: FungibleOutline | null;
  nft: NFTPreview | null;
  collection: Collection | null;
  size: number;
  fallback: React.ReactNode;
}) {
  return fungible?.iconUrl ? (
    <TokenIcon size={size} src={fungible.iconUrl} symbol={fungible.symbol} />
  ) : nft?.metadata?.content?.imagePreviewUrl ? (
    <TokenIcon
      size={size}
      src={nft.metadata.content.imagePreviewUrl}
      style={{ borderRadius: 4 }}
      symbol={nft.metadata.name || nft.tokenId}
    />
  ) : collection?.iconUrl ? (
    <TokenIcon
      size={size}
      src={collection.iconUrl}
      symbol={collection.name || 'Collection'}
    />
  ) : (
    (fallback as JSX.Element)
  );
}
