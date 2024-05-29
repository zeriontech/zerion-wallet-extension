import type { ActionType, AddressAction, Asset } from 'defi-sdk';
import { NFTAsset } from 'defi-sdk';
import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import {
  getFungibleAsset,
  getNftAsset,
} from 'src/modules/ethereum/transactions/actionAsset';
import { Media } from 'src/ui/ui-kit/Media';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { isUnlimitedApproval } from 'src/ui/pages/History/isUnlimitedApproval';
import { AssetQuantity } from '../../AssetQuantity';
import { AssetLink } from '../../AssetLink';

function AssetAllowance({
  baseQuantity,
  commonQuantity,
}: {
  baseQuantity: BigNumber;
  commonQuantity: BigNumber;
}) {
  if (isUnlimitedApproval(baseQuantity)) {
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
  elementEnd,
}: {
  address: string;
  chain: Chain;
  actionType: ActionType;
  fungible: Asset;
  quantity: string;
  elementEnd?: React.ReactNode;
}) {
  const commonQuantity = useMemo(
    () =>
      getCommonQuantity({
        asset: fungible,
        chain,
        baseQuantity: quantity,
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
                <AssetLink asset={fungible} address={address} />
              </UIText>
              {elementEnd}
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
  allowanceQuantityBase,
  elementEnd,
}: {
  address: string;
  chain: Chain;
  actionType: ActionType;
  singleAsset: NonNullable<
    NonNullable<AddressAction['content']>['single_asset']
  >;
  allowanceQuantityBase: string | null;
  elementEnd?: React.ReactNode;
}) {
  const fungibleAsset = getFungibleAsset(singleAsset.asset);
  const nftAsset = getNftAsset(singleAsset.asset);

  // The actual quantity that we want to display here could be either:
  // 1) The value that user set as approved spending allowance
  // 2) Original value that we got from local or interpreted address action
  const quantity = allowanceQuantityBase || singleAsset.quantity;

  if (fungibleAsset) {
    return (
      <FungibleAsset
        address={address}
        chain={chain}
        actionType={actionType}
        fungible={fungibleAsset}
        quantity={quantity}
        elementEnd={elementEnd}
      />
    );
  }
  if (nftAsset) {
    return <NFTAsset nft={nftAsset} />;
  }

  return null;
}
