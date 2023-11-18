import React from 'react';
import type { SwapFormView } from '@zeriontech/transactions';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getError } from 'src/shared/errors/getError';
import type { QuotesData } from './useQuotes';

export function RateLine({
  // swapView,
  quotesData,
}: {
  swapView: SwapFormView;
  quotesData: QuotesData;
}) {
  const { isLoading, quote } = quotesData;

  return (
    <HStack gap={8} justifyContent="space-between">
      <UIText kind="small/regular" color="var(--neutral-700)">
        Rate
      </UIText>
      <span>
        {isLoading && !quote ? (
          <span style={{ color: 'var(--neutral-500)' }}>
            Fetching offers...
          </span>
        ) : quote ? (
          <HStack gap={4}>
            {quote.contract_metadata?.icon_url ? (
              <img
                style={{ width: 20, height: 20 }}
                src={quote.contract_metadata?.icon_url}
                alt={`${quote.contract_metadata.name} logo`}
              />
            ) : null}
            <span>{quote.contract_metadata?.name ?? 'unknown'}</span>
          </HStack>
        ) : quotesData.error ? (
          <UIText kind="small/regular" color="var(--notice-600)">
            {getError(quotesData.error).message}
          </UIText>
        ) : null}
      </span>
    </HStack>
  );
}
