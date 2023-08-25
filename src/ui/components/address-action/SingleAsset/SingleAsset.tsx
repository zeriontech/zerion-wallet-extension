import type { ActionType, AddressAction, Asset } from 'defi-sdk';
import { NFTAsset } from 'defi-sdk';
import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
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
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Button } from 'src/ui/ui-kit/Button';
import { AssetQuantity } from '../../AssetQuantity';

const UNLIMITED = new BigNumber(ethers.constants.MaxUint256.toString());

function AssetAllowance({
  baseQuantity,
  commonQuantity,
}: {
  baseQuantity: BigNumber;
  commonQuantity: BigNumber;
}) {
  if (baseQuantity >= UNLIMITED) {
    return <span>Unlimited</span>;
  } else {
    return <AssetQuantity commonQuantity={commonQuantity} />;
  }
}

function FungibleAsset({
  address,
  chain,
  actionType,
  fungible,
  quantity,
  customAllowanceViewHref,
}: {
  address: string;
  chain: Chain;
  actionType: ActionType;
  fungible: Asset;
  quantity: string;
  customAllowanceViewHref?: string;
}) {
  const title = fungible.symbol.toUpperCase();
  const commonQuantity = useMemo(
    () =>
      getCommonQuantity({
        asset: fungible,
        chain,
        quantity,
      }),
    [chain, fungible, quantity]
  );

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <VStack gap={4}>
        {actionType === 'approve' ? (
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Allow to spend
          </UIText>
        ) : null}
        <Media
          style={{ gridAutoColumns: 'min-content 1fr' }}
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
            <HStack
              gap={4}
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <UIText kind="headline/h3">
                {actionType === 'approve' ? (
                  <AssetAllowance
                    baseQuantity={new BigNumber(quantity)}
                    commonQuantity={commonQuantity}
                  />
                ) : (
                  <AssetQuantity commonQuantity={commonQuantity} />
                )}{' '}
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
              {actionType === 'approve' && customAllowanceViewHref ? (
                <Button
                  as={UnstyledLink}
                  kind="neutral"
                  style={{ color: 'var(--primary)' }}
                  to={customAllowanceViewHref}
                >
                  Edit
                </Button>
              ) : null}
            </HStack>
          }
          detailText={null}
        />
      </VStack>
    </Surface>
  );
}

function NFTAsset({ nft }: { nft: NFTAsset }) {
  const iconUrl = nft.icon_url || nft.collection?.icon_url;

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <VStack gap={4}>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          Access to collection
        </UIText>
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
          text={<UIText kind="headline/h3">{nft.name}</UIText>}
          detailText={null}
        />
      </VStack>
    </Surface>
  );
}

export function SingleAsset({
  address,
  chain,
  actionType,
  singleAsset,
  customAllowanceViewHref,
}: {
  address: string;
  chain: Chain;
  actionType: ActionType;
  singleAsset: NonNullable<
    NonNullable<AddressAction['content']>['single_asset']
  >;
  customAllowanceViewHref?: string;
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
        customAllowanceViewHref={customAllowanceViewHref}
      />
    );
  }
  if (nftAsset) {
    return <NFTAsset nft={nftAsset} />;
  }

  return null;
}
