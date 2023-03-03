import React from 'react';
import { AddressAction, useAssetsPrices } from 'defi-sdk';
import type { PendingAddressAction } from 'src/modules/ethereum/transactions/model';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
import { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { getChainIconURL } from 'src/ui/components/Positions/helpers';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
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

function ActionView({
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

  const explorerHref = chain
    ? networks.getExplorerTxUrlByName(chain, action.transaction.hash)
    : null;

  const actionTitle = `${
    action.transaction.status === 'failed' ? 'Failed ' : ''
  }${action.type.display_value}`;

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
        text={
          <UIText kind="subtitle/m_med">
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
        }
        detailText={
          <HStack alignItems="center" gap={4}>
            {chain ? (
              <Image
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
                title={networks?.getChainName(chain)}
                src={getChainIconURL(action.transaction.chain)}
                renderError={() => (
                  <TokenIcon symbol={action.transaction.chain} size={12} />
                )}
              />
            ) : null}
            <UIText
              kind="subtitle/s_reg"
              color="var(--neutral-500)"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {incomingTransfers?.length &&
              outgoingTransfers?.length &&
              chain ? (
                <HistoryItemValue
                  transfers={outgoingTransfers}
                  direction="out"
                  chain={chain}
                  address={address}
                />
              ) : (
                <span title={getActionAddress(action, { truncate: false })}>
                  {getActionAddress(action, { truncate: true })}
                </span>
              )}
            </UIText>
          </HStack>
        }
      />
      <VStack
        gap={4}
        style={{ justifyItems: 'end', overflow: 'hidden', textAlign: 'left' }}
      >
        <UIText
          kind="subtitle/m_reg"
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
        <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
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

function PendingActionView({
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

  const explorerHref = action.transaction.chain
    ? networks.getExplorerTxUrlByName(
        createChain(action.transaction.chain),
        action.transaction.hash
      )
    : null;

  const isMintingDna =
    normalizeAddress(action.label?.value || '') === DNA_MINT_CONTRACT_ADDRESS;

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
        text={
          explorerHref ? (
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
              <UIText kind="subtitle/m_med">
                {isMintingDna ? 'Mint DNA' : action.type.display_value}
              </UIText>
            </TextAnchor>
          ) : (
            <UIText kind="subtitle/m_med">
              {isMintingDna ? 'Mint DNA' : action.type.display_value}
            </UIText>
          )
        }
        detailText={
          <HStack alignItems="center" gap={4}>
            {action.transaction.chain ? (
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
            <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
              {action.transaction.status === 'pending'
                ? 'Pending'
                : networks?.getChainName(createChain(action.transaction.chain))}
            </UIText>
          </HStack>
        }
      />
      <UIText kind="subtitle/m_reg">
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
  addressAction: AddressAction | PendingAddressAction;
}) {
  const { networks } = useNetworks();
  if (!networks || !addressAction) {
    return null;
  }
  if ('content' in addressAction) {
    return (
      <ActionView action={addressAction as AddressAction} networks={networks} />
    );
  }
  return <PendingActionView action={addressAction} networks={networks} />;
}
