import React, { useMemo } from 'react';
import type { AddressAction } from 'defi-sdk';
import { useAssetsPrices } from 'defi-sdk';
import type { PendingAddressAction } from 'src/modules/ethereum/transactions/model';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ZerionIcon from 'jsx:src/ui/assets/zerion-squircle.svg';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/components/DnaClaim/dnaAddress';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import {
  getFungibleAsset,
  HistoryItemValue,
  TransactionCurrencyValue,
} from './TransactionItemValue';
import {
  AssetIcon,
  transactionIconStyle,
  TransactionItemIcon,
  TRANSACTION_ICON_SIZE,
} from './TransactionTypeIcon';

type AnyAddressAction = AddressAction | PendingAddressAction;

function getActionAddress(
  action: AddressAction | PendingAddressAction,
  { truncate }: { truncate?: boolean }
) {
  const address =
    action.label?.display_value.wallet_address ||
    action.label?.display_value.contract_address;

  return address
    ? truncate
      ? truncateAddress(address, 4)
      : address
    : action.label?.display_value.text;
}

function checkIsDnaMint(action: AnyAddressAction) {
  return (
    normalizeAddress(action.label?.value || '') === DNA_MINT_CONTRACT_ADDRESS
  );
}

function ActionTitle({
  action,
  networks,
}: {
  action: AnyAddressAction;
  networks: Networks;
}) {
  const { chain: chainStr } = action.transaction;
  const chain = chainStr ? createChain(chainStr) : null;

  const explorerHref = chain
    ? networks.getExplorerTxUrlByName(chain, action.transaction.hash)
    : null;

  const isMintingDna = checkIsDnaMint(action);
  const titlePrefix = action.transaction.status === 'failed' ? 'Failed ' : '';
  const actionTitle = isMintingDna
    ? 'Mint DNA'
    : `${titlePrefix}${action.type.display_value}`;
  return (
    <UIText kind="small/accent">
      {explorerHref ? (
        <TextAnchor
          href={explorerHref}
          target="_blank"
          title={explorerHref}
          rel="noopener noreferrer"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {actionTitle}
        </TextAnchor>
      ) : (
        actionTitle
      )}
    </UIText>
  );
}

function ActionDetail({
  action,
  networks,
  address,
}: {
  action: AnyAddressAction;
  networks: Networks;
  address?: string;
}) {
  const { chain: chainStr } = action.transaction;
  const chain = chainStr ? createChain(chainStr) : null;
  const network = useMemo(
    () => (chain ? networks.getNetworkByName(chain) : null),
    [chain, networks]
  );
  const isAddressAction = 'content' in action;
  const incomingTransfers = isAddressAction
    ? action.content?.transfers?.incoming
    : null;
  const outgoingTransfers = isAddressAction
    ? action.content?.transfers?.outgoing
    : null;

  return (
    <HStack alignItems="center" gap={4}>
      <NetworkIcon
        size={12}
        src={network?.icon_url}
        chainId={network?.external_id || ''}
        name={network?.name || null}
      />
      <UIText kind="small/regular" color="var(--neutral-500)">
        {action.transaction.status === 'pending' ? (
          <span style={{ color: 'var(--notice-500)' }}>Pending</span>
        ) : action.transaction.status === 'failed' ? (
          <span style={{ color: 'var(--negative-500)' }}>Failed</span>
        ) : action.transaction.status === 'dropped' ? (
          <span style={{ color: 'var(--negative-500)' }}>Dropped</span>
        ) : incomingTransfers?.length && outgoingTransfers?.length && chain ? (
          <HistoryItemValue
            transfers={outgoingTransfers}
            direction="out"
            chain={chain}
            address={address}
          />
        ) : isAddressAction ? (
          <span title={getActionAddress(action, { truncate: false })}>
            {getActionAddress(action, { truncate: true })}
          </span>
        ) : (
          networks?.getChainName(createChain(action.transaction.chain))
        )}
      </UIText>
    </HStack>
  );
}

function ActionItemBackend({
  action,
  networks,
}: {
  action: AddressAction;
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
  const chain = action.transaction.chain
    ? createChain(action.transaction.chain)
    : null;

  return (
    <HStack
      gap={24}
      justifyContent="space-between"
      style={{
        height: 42,
        gridTemplateColumns:
          'minmax(min-content, max-content) minmax(100px, max-content)',
      }}
      alignItems="center"
    >
      <Media
        image={
          action.transaction.status === 'failed' ? (
            <FailedIcon style={transactionIconStyle} />
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
        text={<ActionTitle action={action} networks={networks} />}
        detailText={
          <ActionDetail networks={networks} action={action} address={address} />
        }
      />
      <VStack
        gap={4}
        style={{ justifyItems: 'end', overflow: 'hidden', textAlign: 'left' }}
      >
        <UIText
          kind="small/regular"
          color={
            shouldUsePositiveColor ? 'var(--positive-500)' : 'var(--black)'
          }
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {action.type.value === 'approve' && maybeApprovedAsset ? (
            <TextAnchor
              href={`https://app.zerion.io/explore/asset/${maybeApprovedAsset.symbol}-${maybeApprovedAsset.asset_code}?address=${address}`}
              target="_blank"
              title={maybeApprovedAsset.name || maybeApprovedAsset.symbol}
              rel="noopener noreferrer"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {maybeApprovedAsset.name || maybeApprovedAsset.symbol}
            </TextAnchor>
          ) : incomingTransfers?.length && chain ? (
            <HistoryItemValue
              transfers={incomingTransfers}
              direction="in"
              chain={chain}
              address={address}
            />
          ) : outgoingTransfers?.length && chain ? (
            <HistoryItemValue
              transfers={outgoingTransfers}
              direction="out"
              chain={chain}
              address={address}
            />
          ) : null}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {incomingTransfers?.length && chain ? (
            <TransactionCurrencyValue
              transfers={incomingTransfers}
              chain={chain}
            />
          ) : outgoingTransfers?.length && chain ? (
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

function ActionItemLocal({
  action,
  networks,
}: {
  action: PendingAddressAction;
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

  const isMintingDna = checkIsDnaMint(action);

  return (
    <HStack
      gap={24}
      justifyContent="space-between"
      style={{ height: 42 }}
      alignItems="center"
    >
      <Media
        image={
          <div style={{ position: 'relative', ...transactionIconStyle }}>
            {action.transaction.status === 'pending' ? (
              <CircleSpinner
                size={`${TRANSACTION_ICON_SIZE + 2}px`}
                trackWidth="7%"
                color="var(--primary)"
                style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                }}
              />
            ) : null}
            {isMintingDna ? (
              <ZerionIcon
                width={TRANSACTION_ICON_SIZE}
                height={TRANSACTION_ICON_SIZE}
              />
            ) : (
              <AssetIcon
                size={TRANSACTION_ICON_SIZE}
                asset={asset ? { fungible: asset } : undefined}
                type={action.type.value}
              />
            )}
          </div>
        }
        text={<ActionTitle action={action} networks={networks} />}
        detailText={
          <ActionDetail networks={networks} action={action} address={address} />
        }
      />
      <UIText kind="small/regular">
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

export function ActionItem({
  addressAction,
}: {
  addressAction: AnyAddressAction;
}) {
  const { networks } = useNetworks();
  if (!networks || !addressAction) {
    return null;
  }
  if ('content' in addressAction) {
    return (
      <ActionItemBackend
        action={addressAction as AddressAction}
        networks={networks}
      />
    );
  }
  return <ActionItemLocal action={addressAction} networks={networks} />;
}
