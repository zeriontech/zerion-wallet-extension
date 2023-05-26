import type { ActionAsset, ActionType, Asset } from 'defi-sdk';
import { NFTAsset } from 'defi-sdk';
import React from 'react';
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

function FungibleAsset({
  address,
  actionType,
  fungible,
}: {
  address: string;
  actionType: ActionType;
  fungible: Asset;
}) {
  const title = fungible.symbol.toUpperCase();

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
            {/* TODO: Add allowed amount once we have it on the backend */}
            <TextAnchor
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
  const iconUrl = nft?.icon_url || nft?.collection?.icon_url;
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
  actionType,
  asset,
}: {
  address: string;
  actionType: ActionType;
  asset: ActionAsset;
}) {
  const fungibleAsset = getFungibleAsset(asset);
  const nftAsset = getNftAsset(asset);

  if (fungibleAsset) {
    return (
      <FungibleAsset
        address={address}
        actionType={actionType}
        fungible={fungibleAsset}
      />
    );
  }
  if (nftAsset) {
    return <NFTAsset nft={nftAsset} />;
  }

  return null;
}
