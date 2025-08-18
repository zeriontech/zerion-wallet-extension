import React, { useCallback, useMemo, useRef } from 'react';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { Button } from 'src/ui/ui-kit/Button';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack';
import BigNumber from 'bignumber.js';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { minus, noValueDash } from 'src/ui/shared/typography';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { useWalletActions } from 'src/modules/zerion-api/hooks/useWalletActions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import type { Action } from 'src/modules/zerion-api/requests/wallet-get-actions';
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
  address,
}: {
  action: Action;
  address: string;
}) {
  const { currency } = useCurrency();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogOpen = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const transfer = useMemo(() => {
    const incomingTransfer = action.content?.transfers
      ?.filter(({ direction }) => direction === 'in')
      .at(0);
    const outgoingTransfer = action.content?.transfers
      ?.filter(({ direction }) => direction === 'out')
      .at(0);
    return incomingTransfer || outgoingTransfer;
  }, [action]);

  if (!transfer) {
    return null;
  }

  const actionType =
    action.type.value === 'trade'
      ? transfer.direction === 'in'
        ? 'Buy'
        : 'Sell'
      : action.type.displayValue;

  const price = transfer?.amount?.value
    ? new BigNumber(transfer.amount.value || 0).dividedBy(
        transfer.amount.quantity
      )
    : null;

  const formattedPrice = price
    ? formatPriceValue(price, 'en', currency)
    : noValueDash;

  const actionTitle = `${actionType} at ${formattedPrice}`;
  const actionDatetime = dateFormatter.format(new Date(action.timestamp));
  const actionBalance = transfer.amount
    ? `${transfer.direction === 'in' ? '+' : minus}${formatTokenValue(
        transfer.amount?.quantity,
        transfer.fungible?.symbol,
        {
          notation: new BigNumber(transfer.amount.quantity).gte(100000)
            ? 'compact'
            : undefined,
        }
      )}`
    : null;
  const actionValue = transfer.amount?.value
    ? formatCurrencyValue(transfer.amount.value, 'en', currency)
    : null;

  return (
    <>
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
              color={
                transfer.direction === 'in'
                  ? 'var(--positive-500)'
                  : 'currentColor'
              }
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
            <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
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
              >
                <ArrowLeftIcon style={{ width: 20, height: 20 }} />
              </Button>
            </form>
            <ActionDetailedView action={action} address={address} />
          </>
        )}
      />
    </>
  );
}

export function AssetHistory({
  fungibleId,
  address,
}: {
  fungibleId: string;
  address: string;
}) {
  const { currency } = useCurrency();
  const { actions, queryData } = useWalletActions(
    {
      addresses: [address],
      currency,
      fungibleId,
      limit: 10,
    },
    { source: useHttpClientSource() }
  );

  const isLoading = queryData.isLoading || queryData.isFetching;

  if (!actions?.length && !isLoading) {
    return null;
  }

  return (
    <VStack gap={8} style={{ opacity: isLoading ? 0.8 : 1 }}>
      <VStack gap={4}>
        <UIText kind="headline/h3">History</UIText>
        <PageFullBleedColumn paddingInline={false}>
          <VStack gap={0}>
            {actions?.map((action) => (
              <AssetHistoryItem
                key={action.id}
                address={address}
                action={action}
              />
            ))}
          </VStack>
        </PageFullBleedColumn>
      </VStack>
      {queryData.hasNextPage ? (
        <Button
          kind="neutral"
          onClick={() => queryData.fetchNextPage()}
          disabled={isLoading}
          style={{
            ['--button-background' as string]: 'var(--neutral-200)',
            ['--button-background-hover' as string]: 'var(--neutral-300)',
          }}
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            <UIText kind="body/accent">More Transactions</UIText>
            {isLoading ? <CircleSpinner /> : null}
          </HStack>
        </Button>
      ) : null}
    </VStack>
  );
}
