import React from 'react';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import type {
  Collection,
  NFTPreview,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';

export function AssetIcon({
  fungible,
  nft,
  collection,
  size,
  fallback = null,
}: {
  fungible: Fungible | null;
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
