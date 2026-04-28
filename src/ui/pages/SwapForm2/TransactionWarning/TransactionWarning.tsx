import React from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { getError } from 'src/shared/errors/getError';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { SwapFormState2 } from '../types';
import * as styles from './TransactionWarning.module.css';

type WarningVariant = 'warning' | 'error';

interface WarningContent {
  variant: WarningVariant;
  title: string;
  description?: string;
}

function resolveWarning({
  quote,
  quotesQuery,
  formState,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
}): WarningContent | null {
  if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return null;
  }

  if (quote?.error) {
    if (quote.error.code === 1) {
      return {
        variant: 'warning',
        title: 'Insufficient balance',
        description: quote.error.message,
      };
    }
    if (quote.error.code === 2) {
      return {
        variant: 'warning',
        title: 'Insufficient gas balance',
        description: quote.error.message,
      };
    }
    return {
      variant: 'error',
      title: 'Transaction will fail',
      description: quote.error.message,
    };
  }

  if (quotesQuery.error && !quotesQuery.isLoading) {
    return {
      variant: 'warning',
      title: 'Unable to fetch quotes',
      description: getError(quotesQuery.error).message,
    };
  }

  const shouldHaveQuotes = Boolean(
    formState.inputAmount &&
      formState.inputFungibleId &&
      formState.outputFungibleId
  );
  if (
    shouldHaveQuotes &&
    !quotesQuery.isLoading &&
    quotesQuery.done &&
    (!quotesQuery.quotes || quotesQuery.quotes.length === 0)
  ) {
    return {
      variant: 'warning',
      title: 'No providers available',
      description: 'This pair can’t be swapped right now.',
    };
  }

  return null;
}

export function TransactionWarning({
  quote,
  quotesQuery,
  formState,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
}) {
  const warning = resolveWarning({ quote, quotesQuery, formState });

  return warning ? (
    <div
      className={
        warning.variant === 'error'
          ? `${styles.card} ${styles.cardError}`
          : styles.card
      }
    >
      <VStack gap={warning.description ? 8 : 0}>
        <UIText kind="small/accent" color="currentColor">
          {warning.title}
        </UIText>
        {warning.description ? (
          <UIText kind="small/regular" color="currentColor">
            {warning.description}
          </UIText>
        ) : null}
      </VStack>
    </div>
  ) : null;
}
