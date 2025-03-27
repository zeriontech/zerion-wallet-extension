import type { ActionTransfer, AddressAction } from 'defi-sdk';
import { useAddressActions } from 'defi-sdk';
import React, { useCallback, useMemo, useRef } from 'react';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type {
  Asset,
  AssetFullInfo,
} from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { Networks } from 'src/modules/networks/Networks';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { minus, noValueDash } from 'src/ui/shared/typography';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import { createChain } from 'src/modules/networks/Chain';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { ActionDetailedView } from '../History/ActionDetailedView';
import * as styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function AssetHistoryItem({
  action,
  asset,
  address,
  networks,
}: {
  action: AddressAction;
  asset: Asset;
  address: string;
  networks: Networks;
}) {
  const { currency } = useCurrency();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogOpen = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleDialogDismiss = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const { transfer, isIncoming } = useMemo(() => {
    const incomingTransfers = action.content?.transfers?.incoming?.filter(
      (item) => getFungibleAsset(item.asset)?.id === asset.id
    );
    const aggregatedIncomingTransfer: ActionTransfer | undefined =
      incomingTransfers?.length
        ? {
            ...incomingTransfers[0],
            quantity: incomingTransfers
              .reduce((acc, item) => acc.plus(item.quantity), new BigNumber(0))
              .toFixed(),
          }
        : undefined;
    const outgoingTransfers = action.content?.transfers?.outgoing?.filter(
      (item) => getFungibleAsset(item.asset)?.id === asset.id
    );
    const aggregatedOutgoingTransfer: ActionTransfer | undefined =
      outgoingTransfers?.length
        ? {
            ...outgoingTransfers[0],
            quantity: outgoingTransfers
              .reduce((acc, item) => acc.plus(item.quantity), new BigNumber(0))
              .toFixed(),
          }
        : undefined;
    return {
      transfer: aggregatedIncomingTransfer || aggregatedOutgoingTransfer,
      isIncoming: Boolean(aggregatedIncomingTransfer),
    };
  }, [action, asset.id]);

  const fungible = getFungibleAsset(transfer?.asset);

  if (!fungible || !transfer) {
    return null;
  }

  const actionType =
    action.type.value === 'trade'
      ? isIncoming
        ? 'Buy'
        : 'Sell'
      : action.type.display_value;

  const formattedPrice = transfer.price
    ? formatPriceValue(transfer.price, 'en', currency)
    : noValueDash;

  const normalizedQuantity = baseToCommon(
    transfer.quantity,
    getDecimals({
      asset: fungible,
      chain: createChain(action.transaction.chain),
    })
  );

  const normalizedAmountAction =
    transfer.price === null || transfer.price === undefined
      ? null
      : normalizedQuantity.multipliedBy(transfer.price);

  const actionTitle = `${actionType} at ${formattedPrice}`;
  const actionDatetime = dateFormatter.format(new Date(action.datetime));
  const actionBalance = `${isIncoming ? '+' : minus}${formatTokenValue(
    normalizedQuantity,
    asset.symbol,
    { notation: normalizedQuantity.gte(100000) ? 'compact' : undefined }
  )}`;
  const actionValue = normalizedAmountAction
    ? formatCurrencyValue(normalizedAmountAction, 'en', currency)
    : null;

  return (
    <>
      <KeyboardShortcut
        combination="backspace"
        onKeyDown={handleDialogDismiss}
      />
      <UnstyledButton onClick={handleDialogOpen} className={styles.historyItem}>
        <div className={styles.historyItemBackdrop} />
        <HStack
          gap={12}
          justifyContent="space-between"
          style={{ position: 'relative', paddingBlock: 12 }}
        >
          <VStack gap={0} style={{ justifyItems: 'start' }}>
            <UIText kind="body/regular">{actionTitle}</UIText>
            <UIText kind="small/regular" color="var(--neutral-500)">
              {actionDatetime}
            </UIText>
          </VStack>
          <VStack gap={0} style={{ justifyItems: 'end' }}>
            <UIText
              kind="body/regular"
              color={isIncoming ? 'var(--positive-500)' : 'currentColor'}
            >
              {actionBalance}
            </UIText>
            <UIText kind="small/regular" color="var(--neutral-500)">
              {actionValue}
            </UIText>
          </VStack>
        </HStack>
      </UnstyledButton>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ backgroundColor: 'var(--neutral-100)' }}
        renderWhenOpen={() => (
          <>
            <Button
              kind="ghost"
              value="cancel"
              size={36}
              style={{
                width: 36,
                padding: 8,
                position: 'absolute',
                top: 16,
                left: 8,
              }}
              onClick={handleDialogDismiss}
            >
              <ArrowLeftIcon style={{ width: 20, height: 20 }} />
            </Button>
            <ActionDetailedView
              action={action}
              networks={networks}
              address={address}
            />
          </>
        )}
      />
    </>
  );
}

export function AssetHistory({
  assetId,
  address,
  assetFullInfo,
}: {
  assetId: string;
  address: string;
  assetFullInfo?: AssetFullInfo;
}) {
  const { networks } = useNetworks();
  const { singleAddressNormalized, ready } = useAddressParams();
  const { currency } = useCurrency();
  const {
    value,
    // TODO: this flag doesn't work, needs to be fixed
    isFetching: actionsAreLoading,
    hasNext,
    fetchMore,
  } = useAddressActions(
    {
      address: singleAddressNormalized,
      currency,
      actions_fungible_ids: [assetId],
    },
    {
      limit: 10,
      listenForUpdates: true,
      paginatedCacheMode: 'first-page',
      enabled: ready,
    }
  );

  const asset = assetFullInfo?.fungible;

  if (!asset || !networks || !value?.length) {
    return null;
  }

  return (
    <VStack gap={8} style={{ opacity: actionsAreLoading ? 0.8 : 1 }}>
      <VStack gap={4}>
        <UIText kind="headline/h3">History</UIText>
        <VStack gap={0}>
          {value.map((action) => (
            <AssetHistoryItem
              key={action.transaction.hash}
              address={address}
              networks={networks}
              asset={asset}
              action={action}
            />
          ))}
        </VStack>
      </VStack>
      {hasNext ? (
        <Button
          kind="neutral"
          onClick={fetchMore}
          disabled={actionsAreLoading}
          style={{
            ['--button-background' as string]: 'var(--neutral-200)',
            ['--button-background-hover' as string]: 'var(--neutral-300)',
          }}
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            <UIText kind="body/accent">More Transactions</UIText>
            {actionsAreLoading ? <CircleSpinner /> : null}
          </HStack>
        </Button>
      ) : null}
    </VStack>
  );
}
