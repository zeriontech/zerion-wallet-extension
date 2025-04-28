import React, { useId } from 'react';
import type { Quote } from 'src/shared/types/Quote';
import type { QuoteSortType } from 'src/ui/shared/requests/useQuotes';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

const QUOTE_GRIP_TEMPLATE_COLUMNS = '40px 1fr 1fr 1fr 1fr';

function QuoteListItem({ quote }: { quote: Quote }) {
  return <div>{quote.contract_metadata?.id}</div>;
}

export function QuoteList({
  quotes,
  selectedQuote,
  onQuoteIdChange,
  sortType,
  onChangeSortType,
}: {
  quotes: Quote[];
  selectedQuote: Quote | null;
  onQuoteIdChange: (quoteId: string | null) => void;
  sortType: QuoteSortType;
  onChangeSortType: (sortType: QuoteSortType) => void;
}) {
  const formId = useId();

  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
      <VStack gap={16}>
        <SegmentedControlGroup childrenLayout="spread-children-evenly">
          <SegmentedControlRadio
            name="sortType"
            value="amount"
            checked={sortType === 'amount'}
            onChange={() => onChangeSortType('amount')}
          >
            Max Received
          </SegmentedControlRadio>
          <SegmentedControlRadio
            name="sortType"
            value="time"
            checked={sortType === 'time'}
            onChange={() => onChangeSortType('time')}
          >
            Fastest Transfer
          </SegmentedControlRadio>
        </SegmentedControlGroup>
        <VStack gap={8}>
          <HStack
            gap={0}
            style={{ gridTemplateColumns: QUOTE_GRIP_TEMPLATE_COLUMNS }}
          >
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
              onQuoteIdChange(quoteId);
            }}
            style={{ maxHeight: 350, overflowY: 'auto', paddingTop: 8 }}
          >
            <VStack gap={8}>
              {quotes.map((quote, _index) => {
                const isSelected =
                  selectedQuote?.contract_metadata?.id ===
                  quote.contract_metadata?.id;
                return (
                  <label
                    className={styles.radio}
                    key={quote.contract_metadata?.id}
                  >
                    <input
                      autoFocus={isSelected}
                      type="radio"
                      name="quoteId"
                      value={quote.contract_metadata?.id}
                      defaultChecked={isSelected}
                    />
                    <QuoteListItem
                      key={quote.contract_metadata?.id}
                      quote={quote}
                    />
                  </label>
                );
              })}
            </VStack>
          </form>
        </VStack>
      </VStack>
    </>
  );
}
