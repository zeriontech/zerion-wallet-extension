import React, { useId } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatSeconds } from 'src/shared/units/formatSeconds';
import { noValueDash } from 'src/ui/shared/typography';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { BridgeFormState } from '../types';
import * as styles from './styles.module.css';

const QUOTE_GRID_TEMPLATE_COLUMNS = '20px 3fr 3fr 2fr 2fr';

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

function BridgeFee({ quote }: { quote: Quote2 }) {
  const feeAsset = quote.bridgeFee?.fungible;
  const feeAmount = quote.bridgeFee?.amount;

  return feeAsset && feeAmount?.usdValue ? (
    <HStack gap={4} alignItems="center">
      <UIText kind="small/accent" color="var(--primary)">
        {formatCurrencyValue(feeAmount.usdValue, 'en', feeAmount.currency)}
      </UIText>
      <UIText kind="small/accent" color="var(--primary)">
        ·
      </UIText>
      <UIText kind="small/accent" color="var(--primary)">
        {feeAsset.symbol}
      </UIText>
    </HStack>
  ) : (
    <UIText
      kind="small/accent"
      style={{
        background:
          'linear-gradient(113deg, #20DBE7 6.71%, #4B7AEF 58.69%, #BC29EF 102.67%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Free
    </UIText>
  );
}

function QuoteComponent({ quote }: { quote: Quote2 }) {
  const { outputAmount } = quote;

  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{ gridTemplateColumns: QUOTE_GRID_TEMPLATE_COLUMNS }}
    >
      <img
        src={quote.contractMetadata?.iconUrl}
        alt={quote.contractMetadata?.name}
        width={20}
        height={20}
        title={quote.contractMetadata?.name}
      />
      <UIText kind="small/regular" style={{ textAlign: 'center' }}>
        {outputAmount.value != null
          ? formatCurrencyValue(outputAmount.value, 'en', outputAmount.currency)
          : 'N/A'}
      </UIText>
      <BridgeFee quote={quote} />
      <UIText kind="small/regular" style={{ textAlign: 'center' }}>
        {quote.transactionSwap ? (
          <QuoteNetworkFee quote={quote} />
        ) : (
          noValueDash
        )}
      </UIText>
      <UIText kind="small/regular" style={{ textAlign: 'right' }}>
        ~{formatSeconds(Number(quote.time))}
      </UIText>
    </HStack>
  );
}

export function QuoteList({
  quotes,
  selectedQuote,
  onChange,
  onReset,
  sortType,
  onSortTypeChange,
}: {
  quotes: Quote2[];
  selectedQuote: Quote2 | null;
  onChange: (quoteId: string | null) => void;
  onReset: () => void;
  sortType: BridgeFormState['sort'];
  onSortTypeChange: (sortType: BridgeFormState['sort']) => void;
}) {
  const formId = useId();

  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
      <VStack gap={24} style={{ marginTop: 24 }}>
        <SegmentedControlGroup childrenLayout="spread-children-evenly">
          <SegmentedControlRadio
            name="sortType"
            value="amount"
            checked={sortType === '1'}
            onChange={() => onSortTypeChange('1')}
          >
            Max Received
          </SegmentedControlRadio>
          <SegmentedControlRadio
            name="sortType"
            value="time"
            checked={sortType === '2'}
            onChange={() => onSortTypeChange('2')}
          >
            Fastest Transfer
          </SegmentedControlRadio>
        </SegmentedControlGroup>
        <VStack gap={16}>
          <HStack
            gap={4}
            style={{
              textAlign: 'center',
              padding: '0 12px',
              gridTemplateColumns: QUOTE_GRID_TEMPLATE_COLUMNS,
            }}
          >
            <div aria-hidden={true} />
            <UIText kind="caption/accent" color="var(--neutral-600)">
              Receive
            </UIText>
            <UIText kind="caption/accent" color="var(--neutral-600)">
              Bridge Fee
            </UIText>
            <UIText kind="caption/accent" color="var(--neutral-600)">
              Gas Fee
            </UIText>
            <UIText
              kind="caption/accent"
              color="var(--neutral-600)"
              style={{ textAlign: 'right' }}
            >
              Time
            </UIText>
          </HStack>
          <form
            id={formId}
            method="dialog"
            onSubmit={(event) => {
              event.stopPropagation();
              const formData = new FormData(event.currentTarget);
              const quoteId = formData.get('quoteId') as string | null;
              if (quoteId || !selectedQuote) {
                onChange(quoteId);
              }
            }}
            style={{ maxHeight: 350, overflowY: 'auto' }}
          >
            <VStack gap={12}>
              {quotes.map((quote) => {
                const isSelected =
                  selectedQuote?.contractMetadata?.id ===
                  quote.contractMetadata?.id;
                return (
                  <label
                    className={styles.radio}
                    key={quote.contractMetadata?.id}
                  >
                    <input
                      autoFocus={isSelected}
                      type="radio"
                      name="quoteId"
                      value={quote.contractMetadata?.id}
                      defaultChecked={isSelected}
                    />
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
    </>
  );
}
