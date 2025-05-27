import React, { useId, useRef } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import { HStack } from 'src/ui/ui-kit/HStack';
import TickIcon from 'jsx:src/ui/assets/check_double.svg';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ShieldIcon from 'jsx:src/ui/assets/shield.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { noValueDash } from 'src/ui/shared/typography';
import { formatPercent } from 'src/shared/units/formatPercent';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { FeeDescription } from './FeeDescription';
import type { FeeTier } from './FeeTier';
import * as styles from './styles.module.css';

function QuoteNetworkFee({ quote }: { quote: Quote2 }) {
  const { networkFee } = quote;
  return (
    <span>
      {networkFee?.amount.value != null
        ? formatCurrencyValue(
            networkFee.amount.value,
            'en',
            networkFee.amount.currency
          )
        : networkFee?.amount.quantity
        ? formatTokenValue(
            networkFee.amount.quantity,
            networkFee.fungible?.symbol ?? ''
          )
        : 'N/A'}
    </span>
  );
}

function QuoteComponent({ quote }: { quote: Quote2 }) {
  const { outputAmount } = quote;

  return (
    <HStack
      gap={0}
      alignItems="center"
      style={{ gridTemplateColumns: '1fr 40px' }}
    >
      <HStack
        gap={0}
        style={{ gridTemplateColumns: '1fr 1fr' }}
        alignItems="start"
      >
        <VStack gap={0} style={{ justifyItems: 'start' }}>
          <UIText kind="small/accent">
            {outputAmount.value != null
              ? formatCurrencyValue(
                  outputAmount.value,
                  'en',
                  outputAmount.currency
                )
              : 'N/A'}
          </UIText>
          {quote.transactionSwap ? (
            <HStack gap={4} alignItems="center">
              <TickIcon />
              <UIText kind="caption/regular" style={{ whiteSpace: 'nowrap' }}>
                Approved for {quote.contractMetadata.name}
              </UIText>
            </HStack>
          ) : null}
        </VStack>
        <UIText kind="small/accent">
          {quote.transactionSwap ? (
            <QuoteNetworkFee quote={quote} />
          ) : (
            noValueDash
          )}
        </UIText>
      </HStack>
      <img
        src={quote.contractMetadata.iconUrl}
        alt={quote.contractMetadata.name}
        width={32}
        height={32}
        title={quote.contractMetadata.name}
      />
    </HStack>
  );
}

export function QuoteList({
  userFeeTier,
  quotes,
  selectedQuote,
  onChange,
  onReset,
}: {
  userFeeTier: FeeTier | null;
  quotes: Quote2[];
  selectedQuote: Quote2 | null;
  onChange: (quoteId: string | null) => void;
  onReset: () => void;
}) {
  const formId = useId();
  const { pathname } = useLocation();
  const feeDescriptionDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />

      <VStack gap={16}>
        <HStack gap={8} alignItems="center">
          <ShieldIcon style={{ color: 'var(--positive-500)' }} />
          <UIText kind="headline/h3">Best Available Rate</UIText>
        </HStack>

        <VStack gap={8}>
          <HStack gap={0} style={{ gridTemplateColumns: '1fr 1fr 40px' }}>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Min. Received
            </UIText>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Network fee
            </UIText>
          </HStack>
          <form
            id={formId}
            method="dialog"
            onSubmit={(event) => {
              event.stopPropagation();
              const formData = new FormData(event.currentTarget);
              const quoteId = formData.get('quoteId') as string | null;
              onChange(quoteId);
            }}
            style={{ maxHeight: 350, overflowY: 'auto', paddingTop: 8 }}
          >
            <VStack gap={8}>
              {quotes.map((quote, index) => {
                const isSelected =
                  selectedQuote?.contractMetadata.id ===
                  quote.contractMetadata.id;
                return (
                  <label
                    className={styles.radio}
                    key={quote.contractMetadata.id}
                  >
                    <input
                      autoFocus={isSelected}
                      type="radio"
                      name="quoteId"
                      value={quote.contractMetadata.id}
                      defaultChecked={isSelected}
                    />
                    {index === 0 ? (
                      <span className={styles.bestRateBadge}>BEST RATE</span>
                    ) : null}
                    <QuoteComponent quote={quote} />
                  </label>
                );
              })}
            </VStack>
          </form>
        </VStack>

        {userFeeTier === 'premium' ? (
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Our platform fee is the{' '}
            <UnstyledButton
              type="button"
              style={{ color: 'var(--primary)' }}
              title="Zerion fees description"
              onClick={() => {
                feeDescriptionDialogRef.current?.showModal();
                emitter.emit('buttonClicked', {
                  buttonScope: 'General',
                  buttonName: 'Quote List Bottom Description',
                  pathname,
                });
              }}
            >
              lowest among top wallets
            </UnstyledButton>{' '}
            and already included — keeping your swaps fast, safe, and secure.
          </UIText>
        ) : userFeeTier === 'regular' && quotes.length ? (
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Our platform fee (
            {formatPercent(quotes[0].protocolFee.percentage, 'en')}%) is already
            included — keeping your swaps fast, safe, and secure.
          </UIText>
        ) : null}
        <HStack
          gap={16}
          style={{ paddingTop: 16, gridTemplateColumns: '1fr 1fr' }}
        >
          <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
            <Button
              kind="neutral"
              size={44}
              onClick={onReset}
              value={DialogButtonValue.cancel}
              style={{ width: '100%' }}
            >
              Reset
            </Button>
          </form>
          <Button kind="primary" size={44} form={formId}>
            Save
          </Button>
        </HStack>
      </VStack>

      {userFeeTier === 'premium' && quotes.length ? (
        <BottomSheetDialog
          ref={feeDescriptionDialogRef}
          height="fit-content"
          containerStyle={{ paddingTop: 16 }}
        >
          <FeeDescription
            userFeeTier="premium"
            fee={quotes[0].protocolFee.percentage}
          />
          <DialogCloseButton
            style={{ position: 'absolute', top: 8, right: 8 }}
          />
        </BottomSheetDialog>
      ) : null}
    </>
  );
}
