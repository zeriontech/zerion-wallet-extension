import React from 'react';
import { AddressAction, PendingAction, useAssetsPrices } from 'defi-sdk';
import type {
  Action,
  RawPendingAction,
} from 'src/modules/ethereum/transactions/model';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
import { Networks } from 'src/modules/networks/Networks';
import { AssetIcon, TransactionItemIcon } from './TransactionTypeIcon';
import {
  getFungibleAsset,
  HistoryItemValue,
  TransactionCurrencyValue,
} from './TransactionItemValue';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { getChainIconURL } from 'src/ui/components/Positions/helpers';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';

function getActionAddress(action: AddressAction | PendingAction) {
  const address =
    action.label?.display_value.wallet_address ||
    action.label?.display_value.contract_address;

  return address
    ? truncateAddress(address, 4)
    : action.label?.display_value.text;
}

function ActionView({
  action,
  networks,
}: {
  action: AddressAction | PendingAction;
  networks: Networks;
}) {
  const { params, ready } = useAddressParams();

  if (!ready) {
    return null;
  }

  const address = 'address' in params ? params.address : undefined;
  const approveTransfers = action.content?.single_asset;
  const incomingTransfers = action.content?.transfers?.incoming;
  const outgoingTransfers = action.content?.transfers?.outgoing;

  const shouldUsePositiveColor =
    incomingTransfers?.length === 1 &&
    Boolean(getFungibleAsset(incomingTransfers[0].asset));
  const maybeApprovedAsset = getFungibleAsset(approveTransfers?.asset);
  const chain = createChain(action.transaction.chain);

  return (
    <HStack
      gap={24}
      justifyContent="space-between"
      style={{ height: 44 }}
      alignItems="center"
    >
      <Media
        gap={12}
        vGap={0}
        image={
          action.transaction.status === 'failed' ? (
            <FailedIcon style={{ width: 36, height: 36 }} />
          ) : action.transaction.status === 'pending' ? (
            <CircleSpinner
              size="38px"
              trackWidth="7%"
              color="var(--primary)"
              style={{
                position: 'absolute',
                top: -1,
                left: -1,
              }}
            />
          ) : (
            <TransactionItemIcon action={action} />
          )
        }
        text={
          <UIText kind="body/accent">{`${
            action.transaction.status === 'failed' ? 'Failed ' : ''
          }${action.type.display_value}`}</UIText>
        }
        detailText={
          <HStack alignItems="center" gap={4}>
            {action.transaction.chain !== NetworkId.Ethereum ? (
              <Image
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
                title={networks?.getChainName(
                  createChain(action.transaction.chain)
                )}
                src={getChainIconURL(action.transaction.chain)}
                renderError={() => (
                  <TokenIcon symbol={action.transaction.chain} size={12} />
                )}
              />
            ) : null}
            <UIText
              kind="small/regular"
              color="var(--neutral-500)"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {action.type.value === 'approve' ||
              action.type.value === 'mint' ? null : incomingTransfers?.length &&
                outgoingTransfers?.length ? (
                <HistoryItemValue
                  transfers={outgoingTransfers}
                  direction="out"
                  chain={chain}
                  address={address}
                />
              ) : (
                getActionAddress(action)
              )}
            </UIText>
          </HStack>
        }
      />
      <VStack gap={0} style={{ justifyItems: 'end' }}>
        <UIText
          kind="body/regular"
          color={
            shouldUsePositiveColor ? 'var(--positive-500)' : 'var(--black)'
          }
        >
          {action.type.value === 'approve' && maybeApprovedAsset ? (
            <TextAnchor
              href={`https://app.zerion.io/explore/asset/${maybeApprovedAsset.symbol}-${maybeApprovedAsset.asset_code}?address=${address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {maybeApprovedAsset.name || maybeApprovedAsset.symbol}
            </TextAnchor>
          ) : incomingTransfers?.length ? (
            <HistoryItemValue
              transfers={incomingTransfers}
              direction="in"
              chain={chain}
              address={address}
            />
          ) : outgoingTransfers?.length ? (
            <HistoryItemValue
              transfers={outgoingTransfers}
              direction="out"
              chain={chain}
              address={address}
            />
          ) : null}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {incomingTransfers?.length ? (
            <TransactionCurrencyValue
              transfers={incomingTransfers}
              chain={chain}
            />
          ) : outgoingTransfers?.length ? (
            <TransactionCurrencyValue
              transfers={outgoingTransfers}
              chain={chain}
            />
          ) : null}
        </UIText>
      </VStack>
    </HStack>
  );
}

function PendingAction({
  action,
  networks,
}: {
  action: RawPendingAction;
  networks: Networks;
}) {
  const { value } = useAssetsPrices(
    {
      asset_codes: action.asset_code ? [action.asset_code.toLowerCase()] : [],
      currency: 'usd',
    },
    { enabled: Boolean(action.asset_code) }
  );

  const { params, ready } = useAddressParams();

  if (!ready) {
    return null;
  }

  const address = 'address' in params ? params.address : undefined;
  const asset = value?.[action.asset_code?.toLowerCase() || ''];

  return (
    <HStack
      gap={24}
      justifyContent="space-between"
      style={{ height: 44 }}
      alignItems="center"
    >
      <Media
        gap={12}
        vGap={0}
        image={
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <CircleSpinner
              size="38px"
              trackWidth="7%"
              color="var(--primary)"
              style={{
                position: 'absolute',
                top: -1,
                left: -1,
              }}
            />
            {asset ? (
              <AssetIcon
                size={36}
                asset={{ fungible: asset }}
                type={action.type.value}
              />
            ) : null}
          </div>
        }
        text={<UIText kind="body/accent">{action.type.display_value}</UIText>}
        detailText={
          <HStack alignItems="center" gap={4}>
            {action.transaction.chain !== NetworkId.Ethereum ? (
              <Image
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
                title={networks?.getChainName(
                  createChain(action.transaction.chain)
                )}
                src={getChainIconURL(action.transaction.chain)}
                renderError={() => (
                  <TokenIcon symbol={action.transaction.chain} size={12} />
                )}
              />
            ) : null}{' '}
            <UIText kind="small/regular" color="var(--neutral-500)">
              Pending
            </UIText>
          </HStack>
        }
      />
      <UIText kind="body/regular">
        {asset ? (
          <TextAnchor
            href={`https://app.zerion.io/explore/asset/${asset.symbol}-${asset.asset_code}?address=${address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {action.type.value === 'approve'
              ? asset.name || asset.symbol
              : asset.symbol}
          </TextAnchor>
        ) : null}
      </UIText>
    </HStack>
  );
}

export function ActionItem({ addressAction }: { addressAction: Action }) {
  const { networks } = useNetworks();
  if (!networks || !addressAction) {
    return null;
  }
  if ('content' in addressAction) {
    return (
      <ActionView action={addressAction as AddressAction} networks={networks} />
    );
  }
  return <PendingAction action={addressAction} networks={networks} />;
}
