import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useQuotesV2 } from 'src/ui/shared/requests/useQuotes';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { resolveTokenValue } from 'src/ui/components/AmountInput/inputKind';
import type { SwapFormState2 } from './types';
import { isReceiverReadyForQuote } from './shared/getCrossEcosystemState';

export function useSwapQuote({
  address,
  formState,
  inputPosition,
  outputPosition,
  isCrossEcosystem,
  outputEcosystem,
}: {
  address: string;
  formState: SwapFormState2;
  inputPosition: FungiblePosition | null;
  outputPosition: FungiblePosition | null;
  isCrossEcosystem: boolean;
  outputEcosystem: BlockchainType | null;
}) {
  const { currency } = useCurrency();
  const { pathname } = useLocation();
  const [userQuoteId, setUserQuoteId] = useState<string | null>(null);

  const inputKind = formState.inputKind ?? 'token';
  const inputPrice = inputPosition?.fungible.meta.price ?? null;

  const resolvedInputAmount = useMemo(() => {
    if (!formState.inputAmount) return formState.inputAmount;
    return resolveTokenValue(formState.inputAmount, inputKind, inputPrice);
  }, [formState.inputAmount, inputKind, inputPrice]);

  const quotesFormState = useMemo(() => {
    // Gas fields are local overrides only — they must never reach the quote
    // request (changing them must not refetch the quote). `slippage` and
    // `nonce` deliberately stay in the request.
    const {
      inputKind: _inputKind,
      networkFeeSpeed: _networkFeeSpeed,
      maxPriorityFee: _maxPriorityFee,
      maxFee: _maxFee,
      gasPrice: _gasPrice,
      gasLimit: _gasLimit,
      ...rest
    } = formState;
    return { ...rest, inputAmount: resolvedInputAmount };
  }, [formState, resolvedInputAmount]);

  const inputFiatValue = useMemo(() => {
    if (!resolvedInputAmount || inputPrice == null) return null;
    const v = Number(resolvedInputAmount) * inputPrice;
    return Number.isFinite(v) ? v : null;
  }, [resolvedInputAmount, inputPrice]);

  const receiverReady = isReceiverReadyForQuote({
    isCrossEcosystem,
    outputEcosystem,
    to: formState.to,
  });

  const quotesQuery = useQuotesV2({
    address,
    currency,
    formState: quotesFormState,
    enabled:
      Boolean(inputPosition) &&
      Boolean(outputPosition) &&
      Boolean(resolvedInputAmount) &&
      receiverReady,
    context: 'Swap',
    pathname,
    inputFiatValue,
  });

  const { inputFungibleId, inputChain, outputFungibleId } = formState;

  useEffect(() => {
    setUserQuoteId(null);
  }, [resolvedInputAmount, inputFungibleId, outputFungibleId, inputChain]);

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
      resolvedInputAmount: resolvedInputAmount ?? null,
    };
  }, [selectedQuote, quotesQuery, resolvedInputAmount]);
}
