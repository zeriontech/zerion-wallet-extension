import { createChain } from 'src/modules/networks/Chain';
import { isNumeric } from 'src/shared/isNumeric';
import { getSlippageOptions } from 'src/ui/shared/forms/trading/getSlippageOptions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Quote2 } from 'src/shared/types/Quote';
import type { SwapFormState } from 'src/shared/types/SwapFormState';
import { createHeaders } from 'src/modules/zerion-api/shared';
import { invariant } from 'src/shared/invariant';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import { useStore } from '@store-unit/react';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import { applyPriceImpactOverride } from 'src/ui/features/dev-menu/applyPriceImpactOverride';
import { walletPort } from '../channels';
import type { QuotesError } from './QuotesError';
import { useEventSource } from './useEventSource';
import { createSwapQuotesV3Url } from './createSwapQuotesV3Url';
export interface QuotesData<T> {
  quotes: T[] | null;
  isLoading: boolean;
  done: boolean;
  error: QuotesError | null;
  refetch: () => void;
}

const QUOTES_EVENT_CODE_TO_MESSAGE = {
  500: 'Internal Server Error',
  503: 'Service Unavailable',
  404: 'No liquidity for this trade',
  400: 'Incorrect trade parameters',
};

export function useQuotesV2({
  address,
  currency,
  formState,
  enabled = true,
  context,
  pathname,
  inputFiatValue = null,
}: {
  address: string;
  currency: string;
  formState: SwapFormState;
  enabled?: boolean;
  context: 'Swap' | 'Bridge';
  pathname: string;
  inputFiatValue?: number | null;
}) {
  const [refetchHash, setRefetchHash] = useState(0);
  const { data: config } = useFirebaseConfig(['quotes_refetch_interval']);
  const refetch = useCallback(() => setRefetchHash((n) => n + 1), []);

  const chain = formState.inputChain ? createChain(formState.inputChain) : null;

  const slippage = useMemo(() => {
    if (!chain) {
      return null;
    }
    if (formState.slippage === 'auto' || formState.slippage == null) {
      return null;
    }
    return String(
      getSlippageOptions({
        chain,
        userSlippage: Number(formState.slippage),
      }).slippagePercent
    );
  }, [chain, formState.slippage]);

  const url = useMemo(() => {
    if (!chain) {
      return null;
    }
    return createSwapQuotesV3Url({
      address,
      currency,
      formState: { ...formState, slippage: slippage ?? undefined },
    });
  }, [address, currency, formState, chain, slippage]);

  const handleQuoteError = useCallback(
    ({
      message,
      code,
      backendMessage,
      requestParams,
    }: {
      message: string;
      code?: number;
      backendMessage?: string;
      requestParams: Partial<SwapFormState> & { from: string };
    }) => {
      invariant(
        requestParams.inputFungibleId,
        'Unable to find inputFungibleId in quotes request'
      );
      invariant(
        requestParams.outputFungibleId,
        'Unable to find outputFungibleId in quotes request'
      );
      invariant(
        requestParams.inputAmount,
        'Unable to find inputAmount in quotes request'
      );
      walletPort.request('quoteError', {
        message,
        errorCode: code,
        backendMessage,
        context,
        actionType: context === 'Swap' ? 'Trade' : 'Send',
        type: context === 'Swap' ? 'Trade form error' : 'Bridge form error',
        address: requestParams.from,
        inputFungibleId: requestParams.inputFungibleId,
        outputFungibleId: requestParams.outputFungibleId,
        inputAmount: requestParams.inputAmount,
        inputChain: requestParams.inputChain || null,
        outputAmount: null,
        outputChain: requestParams.outputChain || null,
        contractType: null,
        pathname,
        slippage: requestParams.slippage
          ? Number(requestParams.slippage)
          : null,
      });
    },
    [context, pathname]
  );

  const {
    value: quotes,
    isLoading,
    error,
    done,
  } = useEventSource<Quote2[]>(
    `${url ?? 'no-url'}-${refetchHash}`,
    url ?? null,
    {
      headers: createHeaders({}),
      enabled:
        enabled &&
        Boolean(
          address &&
            formState.inputChain &&
            formState.inputAmount &&
            isNumeric(formState.inputAmount) &&
            Number(formState.inputAmount) > 0 &&
            formState.inputFungibleId &&
            formState.outputFungibleId
        ),
      mergeResponse: (currentValue, nextValue) => {
        if (!currentValue) {
          return nextValue;
        }
        if (!nextValue) {
          return currentValue;
        }
        return currentValue.map((item) => {
          const updatedItem = nextValue.find(
            (nextItem) =>
              nextItem.contractMetadata &&
              item.contractMetadata &&
              nextItem.contractMetadata.id === item.contractMetadata.id
          );
          return updatedItem || item;
        });
      },
      eventCodeToMessage: QUOTES_EVENT_CODE_TO_MESSAGE,
      onError: ({ parsedError, rawEvent, requestUrl }) => {
        handleQuoteError({
          message: parsedError.message,
          code: rawEvent.code,
          // Raw (placeholder-unreplaced) backend detail groups well in analytics.
          backendMessage: parsedError.details?.detail ?? rawEvent.message,
          requestParams: Object.fromEntries(
            requestUrl.searchParams.entries()
          ) as Partial<SwapFormState> & {
            from: string;
          },
        });
      },
    }
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const refetchInterval = config?.quotes_refetch_interval ?? 20000;

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (done) {
      timeoutRef.current = setTimeout(() => {
        refetch();
      }, refetchInterval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [done, refetch, refetchInterval]);

  const resultRef = useRef(quotes);
  const urlRef = useRef(url);

  const usePreviousData = url === urlRef.current && !done;

  if (url !== urlRef.current) {
    urlRef.current = url;
    resultRef.current = null;
  }

  if (done && quotes && !error) {
    resultRef.current = quotes;
  }
  if (error) {
    resultRef.current = null;
  }

  const { priceImpactOverride } = useStore(devMenuStore);
  const baseQuotes =
    usePreviousData && resultRef.current ? resultRef.current : quotes;
  const overriddenQuotes = useMemo(
    () =>
      applyPriceImpactOverride({
        quotes: baseQuotes,
        inputFiatValue,
        override: priceImpactOverride,
      }),
    [baseQuotes, inputFiatValue, priceImpactOverride]
  );

  return {
    quotes: overriddenQuotes,
    isPreviousData: Boolean(usePreviousData && resultRef.current),
    isLoading,
    error,
    done,
    refetch,
  };
}
