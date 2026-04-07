import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useQuotesV2 } from 'src/ui/shared/requests/useQuotes';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { SwapFormState2 } from './types';

export function useSwapQuote({
  address,
  formState,
  inputPosition,
  outputPosition,
}: {
  address: string;
  formState: SwapFormState2;
  inputPosition: FungiblePosition | null;
  outputPosition: FungiblePosition | null;
}) {
  const { currency } = useCurrency();
  const { pathname } = useLocation();
  const [userQuoteId, setUserQuoteId] = useState<string | null>(null);

  const quotesQuery = useQuotesV2({
    address,
    currency,
    formState,
    enabled:
      Boolean(inputPosition) &&
      Boolean(outputPosition) &&
      Boolean(formState.inputAmount),
    context: 'Swap',
    pathname,
  });

  const { inputAmount, inputFungibleId, inputChain, outputFungibleId } =
    formState;

  useEffect(() => {
    setUserQuoteId(null);
  }, [inputAmount, inputFungibleId, outputFungibleId, inputChain]);

  const selectedQuote = useMemo(() => {
    const userQuote = quotesQuery.quotes?.find(
      (quote) => quote.contractMetadata?.id === userQuoteId
    );
    const defaultQuote = quotesQuery.quotes?.[0];
    return userQuote || defaultQuote || null;
  }, [userQuoteId, quotesQuery.quotes]);

  return useMemo(() => {
    return {
      quote: selectedQuote,
      quotesQuery,
      setUserQuoteId,
    };
  }, [selectedQuote, quotesQuery]);
}
