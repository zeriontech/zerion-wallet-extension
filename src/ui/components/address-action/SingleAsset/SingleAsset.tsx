import type { ActionType, AddressAction, Asset } from 'defi-sdk';
import { NFTAsset } from 'defi-sdk';
import React, { useMemo } from 'react';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import { Media } from 'src/ui/ui-kit/Media';
import { Surface } from 'src/ui/ui-kit/Surface';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { getAssetQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { AssetQuantityValue } from '../../AssetQuantityValue';

function FungibleAsset({
  address,
  chain,
  actionType,
  fungible,
  quantity,
}: {
  address: string;
  chain: Chain;
  actionType: ActionType;
  fungible: Asset;
  quantity: string;
}) {
  const title = fungible.symbol.toUpperCase();

  const assetQuantity = useMemo(
    () =>
      getAssetQuantity({
        asset: fungible,
        chain,
        quantity,
      }),
    [chain, fungible, quantity]
  );

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        vGap={0}
        image={
          fungible?.icon_url ? (
            <TokenIcon
              size={36}
              src={fungible.icon_url}
              symbol={fungible.symbol}
            />
          ) : (
            <UnknownIcon />
          )
        }
        text={
          actionType === 'approve' ? (
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Allow to spend
            </UIText>
          ) : null
        }
        detailText={
          <UIText kind="headline/h3">
            <AssetQuantityValue quantity={assetQuantity} />{' '}
            <TextAnchor
              // Open URL in a new _window_ so that extension UI stays open and visible
              onClick={openInNewWindow}
              href={`https://app.zerion.io/explore/asset/${fungible.symbol}-${fungible.asset_code}?address=${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {title}
            </TextAnchor>
          </UIText>
        }
      />
    </Surface>
  );
}

function NFTAsset({ nft }: { nft: NFTAsset }) {
  const iconUrl = nft.icon_url || nft.collection?.icon_url;
  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        vGap={0}
        image={
          iconUrl ? (
            <TokenIcon
              size={36}
              src={iconUrl}
              style={{ borderRadius: 4 }}
              symbol={nft.symbol}
            />
          ) : (
            <UnknownIcon />
          )
        }
        text={
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Access to collection
          </UIText>
        }
        detailText={<UIText kind="headline/h3">{nft.name}</UIText>}
      />
    </Surface>
  );
}

export function SingleAsset({
  address,
  chain,
  actionType,
  singleAsset,
}: {
  address: string;
  chain: Chain;
  actionType: ActionType;
  singleAsset: NonNullable<
    NonNullable<AddressAction['content']>['single_asset']
  >;
}) {
  const fungibleAsset = getFungibleAsset(singleAsset.asset);
  const nftAsset = getNftAsset(singleAsset.asset);

  if (fungibleAsset) {
    return (
      <FungibleAsset
        address={address}
        chain={chain}
        actionType={actionType}
        fungible={fungibleAsset}
        quantity={singleAsset.quantity}
      />
    );
  }
  if (nftAsset) {
    return <NFTAsset nft={nftAsset} />;
  }

  return null;
}
