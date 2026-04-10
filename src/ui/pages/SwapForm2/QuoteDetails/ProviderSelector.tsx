import React, { useId } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import ShieldIcon from 'jsx:src/ui/assets/shield.svg';
import {
  formatCurrencyValue,
  formatCurrencyValueExtra,
} from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/ui/shared/typography';
import * as styles from './QuoteDetails.module.css';

function QuoteNetworkFee({ quote }: { quote: Quote2 }) {
  const { networkFee } = quote;
  return (
    <span>
      {networkFee?.amount?.value != null
        ? formatCurrencyValueExtra(
            networkFee.amount.value,
            'en',
            networkFee.amount.currency,
            { zeroRoundingFallback: 0.01 }
          )
        : networkFee?.amount?.quantity
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
        style={{ borderRadius: 8 }}
        title={quote.contractMetadata.name}
      />
    </HStack>
  );
}

export function ProviderSelector({
  quotes,
  selectedQuote,
  onSelect,
}: {
  quotes: Quote2[];
  selectedQuote: Quote2 | null;
  onSelect: (quoteId: string | null) => void;
}) {
  const formId = useId();

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
              Received
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
              onSelect(quoteId);
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

        <HStack
          gap={16}
          style={{ paddingTop: 16, gridTemplateColumns: '1fr 1fr' }}
        >
          <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
            <Button
              kind="neutral"
              size={44}
              onClick={() => onSelect(null)}
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
    </>
  );
}
