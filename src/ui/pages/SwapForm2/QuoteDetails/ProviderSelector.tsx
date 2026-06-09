import React from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import {
  formatCurrencyValue,
  formatCurrencyValueExtra,
} from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { noValueDash } from 'src/ui/shared/typography';
import * as styles from './ProviderSelector.module.css';

function formatReceive(quote: Quote2): string {
  const received = quote.outputAmountAfterFees;
  if (received.value != null) {
    return formatCurrencyValue(received.value, 'en', received.currency);
  }
  return formatTokenValue(received.quantity);
}

function formatTime(quote: Quote2): string {
  if (quote.time == null) {
    return noValueDash;
  }
  return `~${formatSeconds(Number(quote.time))}`;
}

function formatNetworkFee(quote: Quote2): string {
  const { networkFee } = quote;
  if (networkFee?.free) {
    return 'Free';
  }
  if (networkFee?.amount?.value != null) {
    return formatCurrencyValueExtra(
      networkFee.amount.value,
      'en',
      networkFee.amount.currency,
      { zeroRoundingFallback: 0.01 }
    );
  }
  if (networkFee?.amount?.quantity) {
    return formatTokenValue(
      networkFee.amount.quantity,
      networkFee.fungible?.symbol ?? ''
    );
  }
  return noValueDash;
}

function ProviderCard({
  quote,
  rank,
  isSelected,
  onClick,
}: {
  quote: Quote2;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const showTime = quote.time != null;
  const secondaryLabel = showTime ? 'Time' : 'Network fee';
  const secondaryValue = showTime ? formatTime(quote) : formatNetworkFee(quote);

  return (
    <UnstyledButton
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onClick}
    >
      <VStack gap={16}>
        <HStack gap={8} justifyContent="space-between" alignItems="center">
          <HStack gap={8} alignItems="center">
            <img
              src={quote.contractMetadata.iconUrl}
              alt={quote.contractMetadata.name}
              width={24}
              height={24}
              className={styles.icon}
            />
            <UIText kind="body/accent">{quote.contractMetadata.name}</UIText>
          </HStack>
          <div
            className={`${styles.rankBadge} ${
              isSelected ? styles.rankBadgeSelected : ''
            }`}
          >
            <UIText kind="caption/accent">{rank}</UIText>
          </div>
        </HStack>
        <VStack gap={8}>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular">Receive</UIText>
            <UIText kind="small/accent">{formatReceive(quote)}</UIText>
          </HStack>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular">{secondaryLabel}</UIText>
            <UIText kind="small/accent">{secondaryValue}</UIText>
          </HStack>
        </VStack>
      </VStack>
    </UnstyledButton>
  );
}

function SortByChip({ onClick }: { onClick: () => void }) {
  return (
    <div className={styles.sortChipWrapper}>
      <UnstyledButton className={styles.sortChip} onClick={onClick}>
        <UIText kind="caption/accent">By Amount Received</UIText>
        <ChevronDownIcon className={styles.sortChipChevron} />
      </UnstyledButton>
    </div>
  );
}

export function ProviderSelector({
  quotes,
  selectedQuote,
  onSelect,
  onReset,
}: {
  quotes: Quote2[];
  selectedQuote: Quote2 | null;
  onSelect: (quoteId: string) => void;
  onReset: () => void;
}) {
  const sortByDialog = useDialog2();

  return (
    <>
      <div className={styles.wrapper}>
        <VStack gap={24}>
          <UIText kind="body/accent">
            Zerion finds the most efficient path for your trade across top DEX
            aggregators.
          </UIText>
          <VStack gap={16}>
            <SortByChip onClick={sortByDialog.openDialog} />
            <VStack gap={16}>
              {quotes.map((quote, index) => {
                const isSelected =
                  selectedQuote?.contractMetadata.id ===
                  quote.contractMetadata.id;
                return (
                  <ProviderCard
                    key={quote.contractMetadata.id}
                    quote={quote}
                    rank={index + 1}
                    isSelected={isSelected}
                    onClick={() => onSelect(quote.contractMetadata.id)}
                  />
                );
              })}
            </VStack>
          </VStack>
        </VStack>
      </div>
      <div className={styles.footer}>
        <Button
          kind="neutral"
          size={48}
          onClick={onReset}
          style={{ width: '100%' }}
        >
          Auto-select first rate
        </Button>
      </div>

      <Dialog2
        open={sortByDialog.open}
        onClose={sortByDialog.closeDialog}
        title="Sort by"
        size="content"
        autoFocusInput={false}
      >
        <div className={styles.sortOptions}>
          <div className={styles.sortOption}>
            <UIText kind="body/accent">Amount Received</UIText>
            <CheckIcon className={styles.sortOptionCheck} />
          </div>
        </div>
      </Dialog2>
    </>
  );
}
